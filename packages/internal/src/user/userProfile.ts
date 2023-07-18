import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import {
	createWalletAddress,
	decodeAddressByProtocol,
	encodeAddressByProtocol,
	formatAddress,
	MAILCHAIN,
	parseNameServiceAddress,
	ProtocolType,
} from '@mailchain/addressing';
import {
	publicKeyFromBytes,
	Decrypter,
	publicKeyToBytes,
	Encrypter,
	PublicKey,
	SignerWithPublicKey,
} from '@mailchain/crypto';
import { AxiosError, isAxiosError } from 'axios';
import {
	Setting,
	UserApiFactory,
	UserApiInterface,
	createAxiosConfiguration,
	getAxiosWithSigner,
} from '@mailchain/api';
import { Configuration } from '../configuration';
import { IdentityKeys } from '../identityKeys';
import { Nameservices } from '../nameservices';
import { user } from '../protobuf/user/user';
import { combineMigrations } from '../migration';
import {
	createV2IdentityKey,
	createV3LabelMigration,
	createV4AliasesMigration,
	createV5NsMigration,
	createV6FixNsAliasFormatMigration,
	UserMailboxMigrationRule,
} from './migrations';
import { Alias, UserMailbox } from './types';
import { createMailboxAlias } from './createAlias';
import { consolidateMailbox } from './consolidateMailbox';

export type UserSettings = {
	[key: string]: {
		[key: string]: Setting | undefined;
	};
};

export class UserNotFoundError extends Error {
	constructor() {
		super(`user not found for provided key`);
	}
}

export const GENERIC_SETTINGS_GROUP = 'generic' as const;

export type SettingsGroup = typeof GENERIC_SETTINGS_GROUP;

const CURRENT_MAILBOX_VERSION = 6 as const;

export type NewUserMailbox = Omit<UserMailbox, 'id' | 'type'>;

export interface UserProfile {
	mailboxes(): Promise<[UserMailbox, ...UserMailbox[]]>;
	addMailbox(mailbox: NewUserMailbox): Promise<UserMailbox>;
	updateMailbox(mailboxId: string, mailbox: NewUserMailbox): Promise<UserMailbox>;
	removeMailbox(mailboxId: string): Promise<void>;
	getSetting(key: string): Promise<Setting | undefined>;
	getSettings(group?: SettingsGroup): Promise<Map<string, Setting>>;
	setSetting(key: string, value: string, opts?: { group?: SettingsGroup }): Promise<void>;
	deleteSetting(key: string): Promise<void>;
	getUsername(): Promise<{ username: string; address: string }>;
}

export class MailchainUserProfile implements UserProfile {
	constructor(
		private readonly mailchainAddressDomain: string,
		private readonly userApi: UserApiInterface,
		private readonly accountIdentityKey: () => Promise<PublicKey>,
		private readonly mailboxCrypto: Encrypter & Decrypter,
		private readonly migration: UserMailboxMigrationRule,
	) {}

	static create(
		config: Configuration,
		accountIdentityKey: SignerWithPublicKey,
		mailboxCrypto: Encrypter & Decrypter,
	): MailchainUserProfile {
		const axiosConfig = createAxiosConfiguration(config.apiPath);
		const identityKeys = IdentityKeys.create(config);
		const userApi = UserApiFactory(axiosConfig, undefined, getAxiosWithSigner(accountIdentityKey));
		const nameservice = Nameservices.create(config);
		const migrations = combineMigrations(
			createV2IdentityKey(identityKeys, config.mailchainAddressDomain),
			createV3LabelMigration(config.mailchainAddressDomain),
			createV4AliasesMigration(config.mailchainAddressDomain),
			createV5NsMigration(nameservice),
			createV6FixNsAliasFormatMigration(config.mailchainAddressDomain),
		);
		return new MailchainUserProfile(
			config.mailchainAddressDomain,
			userApi,
			() => Promise.resolve(accountIdentityKey.publicKey),
			mailboxCrypto,
			migrations,
		);
	}

	async getUsername() {
		return this.userApi
			.getUsername()
			.then((response) => {
				const { data } = response;
				return {
					address: data.address,
					username: data.username,
				};
			})
			.catch((e: AxiosError) => {
				if (e.response?.status === 404) {
					throw new UserNotFoundError();
				}
				throw e;
			});
	}

	async setSetting(key: string, value: string, opts?: { group?: SettingsGroup }) {
		await this.userApi.putUserSetting(key, { value, group: opts?.group });
	}

	async getSettings(group?: SettingsGroup) {
		try {
			const { data } = await this.userApi.getUserSettings(group);
			return new Map<string, Setting>(data.settings.map((s) => [s.name, s]));
		} catch (e) {
			if (isAxiosError(e) && e.response?.status === 422) {
				// Invalid group
				return new Map<string, Setting>();
			}
			throw e;
		}
	}

	async getSetting(key: string) {
		try {
			const { data } = await this.userApi.getUserSetting(key);
			return data;
		} catch (e) {
			if (isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 422)) {
				return undefined;
			}
			throw e;
		}
	}

	async deleteSetting(key: string) {
		await this.userApi.deleteUserSetting(key);
	}

	async mailboxes(): Promise<[UserMailbox, ...UserMailbox[]]> {
		const { mailboxes: apiMailboxes } = await this.userApi.getUserMailboxes().then((r) => r.data);
		const resultMailboxes: UserMailbox[] = [];
		for (const apiMailbox of apiMailboxes) {
			try {
				const decryptedMailbox = await this.mailboxCrypto.decrypt(
					decodeBase64(apiMailbox.encryptedMailboxInformation),
				);

				const originalMailboxData = {
					version: apiMailbox.version,
					protoMailbox: user.Mailbox.decode(decryptedMailbox),
				};

				const mailboxData = (await this.migration.shouldApply(originalMailboxData))
					? await this.migration.apply(originalMailboxData)
					: originalMailboxData;

				if (apiMailbox.version !== mailboxData.version) {
					console.debug(
						`${apiMailbox.mailboxId} migrated from v${apiMailbox.version} to v${mailboxData.version}`,
					);
					this.internalUpdateMailbox(
						apiMailbox.mailboxId,
						mailboxData.protoMailbox,
						mailboxData.version,
					).then(
						() => console.debug(`successfully stored migrated mailbox ${apiMailbox.mailboxId}`),
						(e) => console.warn(`failed storing migrated mailbox ${apiMailbox.mailboxId}`, e),
					);
				}

				const { protoMailbox } = mailboxData;
				const protocol = protoMailbox.protocol as ProtocolType;
				const encodedAddress = encodeAddressByProtocol(protoMailbox.address!, protocol).encoded;

				const fallbackAlias = createMailboxAlias(
					createWalletAddress(encodedAddress, protocol, this.mailchainAddressDomain),
				);

				const mailboxAliases = protoMailbox.aliases.map(user.Mailbox.Alias.create).map((protoAlias) => {
					return createMailboxAlias(parseNameServiceAddress(protoAlias.address), {
						allowSending: !protoAlias.blockSending,
						allowReceiving: !protoAlias.blockReceiving,
					});
				});

				resultMailboxes.push({
					type: 'wallet',
					id: apiMailbox.mailboxId,
					identityKey: publicKeyFromBytes(protoMailbox.identityKey),
					label: protoMailbox.label ?? null,
					aliases: mailboxAliases.length > 0 ? (mailboxAliases as [Alias, ...Alias[]]) : [fallbackAlias],
					messagingKeyParams: {
						address: protoMailbox.address,
						protocol,
						network: protoMailbox.network,
						nonce: protoMailbox.nonce,
					},
				});
			} catch (e) {
				console.error(`failed processing mailbox ${apiMailbox.mailboxId}`, e);
			}
		}

		return [await this.accountMailbox(), ...resultMailboxes];
	}

	private async accountMailbox(): Promise<UserMailbox> {
		const { username, address } = await this.getUsername();
		const addressAlias = createMailboxAlias(createWalletAddress(username, MAILCHAIN, this.mailchainAddressDomain));

		return {
			type: 'account',
			id: address,
			identityKey: await this.accountIdentityKey(),
			label: null,
			aliases: [addressAlias],
			messagingKeyParams: {
				address: decodeAddressByProtocol(username, MAILCHAIN).decoded,
				protocol: MAILCHAIN,
				network: this.mailchainAddressDomain,
				nonce: 1,
			},
		};
	}

	async addMailbox(mailbox: NewUserMailbox): Promise<UserMailbox> {
		const consolidatedMailbox = consolidateMailbox(mailbox);
		const protoMailbox = createProtoUserMailbox(consolidatedMailbox);
		const encrypted = await this.mailboxCrypto.encrypt(user.Mailbox.encode(protoMailbox).finish());
		const { mailboxId } = await this.userApi
			.postUserMailbox({ encryptedMailboxInformation: encodeBase64(encrypted), version: CURRENT_MAILBOX_VERSION })
			.then((res) => res.data);

		return { ...consolidatedMailbox, type: 'wallet', id: mailboxId };
	}

	async updateMailbox(mailboxId: string, mailbox: NewUserMailbox): Promise<UserMailbox> {
		const consolidatedMailbox = consolidateMailbox(mailbox);
		const protoMailbox = createProtoUserMailbox(consolidatedMailbox);
		await this.internalUpdateMailbox(mailboxId, protoMailbox, CURRENT_MAILBOX_VERSION);
		return { id: mailboxId, type: 'wallet', ...consolidatedMailbox };
	}

	async removeMailbox(mailboxId: string): Promise<void> {
		await this.userApi.deleteUserMailbox(mailboxId);
		return;
	}

	private async internalUpdateMailbox(
		addressId: string,
		protoMailbox: user.Mailbox,
		version: number,
	): Promise<user.Mailbox> {
		const encrypted = await this.mailboxCrypto.encrypt(user.Mailbox.encode(protoMailbox).finish());
		await this.userApi.putUserMailbox(addressId, { encryptedMailboxInformation: encodeBase64(encrypted), version });
		return protoMailbox;
	}
}

function createProtoUserMailbox(mailbox: NewUserMailbox): user.Mailbox {
	return user.Mailbox.create({
		identityKey: publicKeyToBytes(mailbox.identityKey),
		address: mailbox.messagingKeyParams.address,
		protocol: mailbox.messagingKeyParams.protocol,
		network: mailbox.messagingKeyParams.network,
		nonce: mailbox.messagingKeyParams.nonce,
		label: mailbox.label,
		aliases: mailbox.aliases.map(createProtoAlias),
	});
}

function createProtoAlias(alias: Alias): user.Mailbox.Alias {
	return user.Mailbox.Alias.create({
		address: formatAddress(alias.address, 'mail'),
		blockSending: !alias.allowSending,
		blockReceiving: !alias.allowReceiving,
	});
}
