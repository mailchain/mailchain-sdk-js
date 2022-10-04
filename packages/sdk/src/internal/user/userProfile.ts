import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import {
	createWalletAddress,
	decodeAddressByProtocol,
	encodeAddressByProtocol,
	MAILCHAIN,
	ProtocolType,
} from '@mailchain/addressing';
import {
	decodePublicKey,
	Decrypter,
	encodePublicKey,
	Encrypter,
	PublicKey,
	SignerWithPublicKey,
} from '@mailchain/crypto';
import { AxiosError } from 'axios';
import { user } from '../protobuf/user/user';
import { AddressesApiFactory, Setting, UserApiFactory, UserApiInterface } from '../api';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';
import { getAxiosWithSigner } from '../auth/jwt';
import { combineMigrations } from '../migration';
import { createV1V2IdentityKeyMigration, UserMailboxMigrationRule } from './migrations';
import { UserMailbox } from './types';

export type UserSettings = { [key: string]: Setting | undefined };

export class UserNotFoundError extends Error {
	constructor() {
		super(`user not found for provided key`);
	}
}

const CURRENT_MAILBOX_VERSION = 2 as const;

export type NewUserMailbox = Omit<UserMailbox, 'id' | 'type'>;

export interface UserProfile {
	mailboxes(): Promise<[UserMailbox, ...UserMailbox[]]>;
	addMailbox(mailbox: NewUserMailbox): Promise<UserMailbox>;
	updateMailbox(mailboxId: string, mailbox: NewUserMailbox): Promise<UserMailbox>;
	removeMailbox(mailboxId: string): Promise<void>;
	getSettings(): Promise<UserSettings>;
	setSetting(key: string, value: string): Promise<void>;
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
		const axiosConfig = createAxiosConfiguration(config);
		const addressesApi = AddressesApiFactory(axiosConfig);
		const userApi = UserApiFactory(axiosConfig, undefined, getAxiosWithSigner(accountIdentityKey));
		const migrations = combineMigrations(
			createV1V2IdentityKeyMigration(addressesApi, config.mailchainAddressDomain),
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

	async setSetting(key: string, value: string) {
		await this.userApi.putUserSetting(key, { value });
	}

	async getSettings(): Promise<UserSettings> {
		const { data } = await this.userApi.getUserSettings();
		return data.settings ?? {};
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

				resultMailboxes.push({
					type: 'wallet',
					id: apiMailbox.mailboxId,
					identityKey: decodePublicKey(protoMailbox.identityKey),
					sendAs: [createWalletAddress(encodedAddress, protocol, this.mailchainAddressDomain)],
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

		return {
			type: 'account',
			id: address,
			identityKey: await this.accountIdentityKey(),
			sendAs: [createWalletAddress(username, MAILCHAIN, this.mailchainAddressDomain)],
			messagingKeyParams: {
				address: decodeAddressByProtocol(username, MAILCHAIN).decoded,
				protocol: MAILCHAIN,
				network: this.mailchainAddressDomain,
				nonce: 1,
			},
		};
	}

	async addMailbox(mailbox: NewUserMailbox): Promise<UserMailbox> {
		const protoMailbox = user.Mailbox.create({
			identityKey: encodePublicKey(mailbox.identityKey),
			address: mailbox.messagingKeyParams.address,
			protocol: mailbox.messagingKeyParams.protocol,
			network: mailbox.messagingKeyParams.network,
			nonce: mailbox.messagingKeyParams.nonce,
		});
		const encrypted = await this.mailboxCrypto.encrypt(user.Mailbox.encode(protoMailbox).finish());
		const { mailboxId } = await this.userApi
			.postUserMailbox({ encryptedMailboxInformation: encodeBase64(encrypted), version: CURRENT_MAILBOX_VERSION })
			.then((res) => res.data);

		return { ...mailbox, type: 'wallet', id: mailboxId };
	}

	async updateMailbox(mailboxId: string, mailbox: NewUserMailbox): Promise<UserMailbox> {
		const protoMailbox = user.Mailbox.create({
			identityKey: encodePublicKey(mailbox.identityKey),
			address: mailbox.messagingKeyParams.address,
			protocol: mailbox.messagingKeyParams.protocol,
			network: mailbox.messagingKeyParams.network,
			nonce: mailbox.messagingKeyParams.nonce,
		});
		await this.internalUpdateMailbox(mailboxId, protoMailbox, CURRENT_MAILBOX_VERSION);
		return { id: mailboxId, type: 'wallet', ...mailbox };
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

	async removeMailbox(mailboxId: string): Promise<void> {
		await this.userApi.deleteUserMailbox(mailboxId);
		return;
	}
}
