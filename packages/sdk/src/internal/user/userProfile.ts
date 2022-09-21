import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import {
	createMailchainAddress,
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
import { createV1V2IdentityKeyMigration, UserAddressMigrationRule } from './migrations';
import { UserMailbox } from './types';

export type UserSettings = { [key: string]: Setting | undefined };

export class UserNotFoundError extends Error {
	constructor() {
		super(`user not found for provided key`);
	}
}

const CURRENT_ADDRESS_VERSION = 2 as const;

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
		private readonly addressCrypto: Encrypter & Decrypter,
		private readonly migration: UserAddressMigrationRule,
	) {}

	static create(
		config: Configuration,
		accountIdentityKey: SignerWithPublicKey,
		addressCrypto: Encrypter & Decrypter,
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
			addressCrypto,
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
		const { addresses } = await this.userApi.getUserAddresses().then((r) => r.data);
		const resultMailboxes: UserMailbox[] = [];
		for (const apiAddress of addresses) {
			try {
				const decryptedAddress = await this.addressCrypto.decrypt(
					decodeBase64(apiAddress.encryptedAddressInformation),
				);

				const originalAddressData = {
					version: apiAddress.version,
					protoAddress: user.Address.decode(decryptedAddress),
				};

				const addressData = (await this.migration.shouldApply(originalAddressData))
					? await this.migration.apply(originalAddressData)
					: originalAddressData;

				if (apiAddress.version !== addressData.version) {
					console.debug(
						`${apiAddress.addressId} migrated from v${apiAddress.version} to v${addressData.version}`,
					);
					this.internalUpdateMailbox(
						apiAddress.addressId,
						addressData.protoAddress,
						addressData.version,
					).then(
						() => console.debug(`successfully stored migrated address ${apiAddress.addressId}`),
						(e) => console.warn(`failed storing migrated address ${apiAddress.addressId}`, e),
					);
				}

				const { protoAddress } = addressData;
				const protocol = protoAddress.protocol as ProtocolType;
				const encodedAddress = encodeAddressByProtocol(protoAddress.address!, protocol).encoded;

				resultMailboxes.push({
					type: 'wallet',
					id: apiAddress.addressId,
					identityKey: decodePublicKey(protoAddress.identityKey),
					sendAs: [createMailchainAddress(encodedAddress, protocol, this.mailchainAddressDomain)],
					messagingKeyParams: {
						address: protoAddress.address,
						protocol,
						network: protoAddress.network,
						nonce: protoAddress.nonce,
					},
				});
			} catch (e) {
				console.error(`failed processing address ${apiAddress.addressId}`, e);
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
			sendAs: [createMailchainAddress(username, MAILCHAIN, this.mailchainAddressDomain)],
			messagingKeyParams: {
				address: decodeAddressByProtocol(username, MAILCHAIN).decoded,
				protocol: MAILCHAIN,
				network: this.mailchainAddressDomain,
				nonce: 1,
			},
		};
	}

	async addMailbox(mailbox: NewUserMailbox): Promise<UserMailbox> {
		const protoAddress = user.Address.create({
			identityKey: encodePublicKey(mailbox.identityKey),
			address: mailbox.messagingKeyParams.address,
			protocol: mailbox.messagingKeyParams.protocol,
			network: mailbox.messagingKeyParams.network,
			nonce: mailbox.messagingKeyParams.nonce,
		});
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		const { addressId } = await this.userApi
			.postUserAddress({ encryptedAddressInformation: encodeBase64(encrypted), version: CURRENT_ADDRESS_VERSION })
			.then((res) => res.data);

		return { ...mailbox, type: 'wallet', id: addressId };
	}

	async updateMailbox(mailboxId: string, mailbox: NewUserMailbox): Promise<UserMailbox> {
		const protoAddress = user.Address.create({
			identityKey: encodePublicKey(mailbox.identityKey),
			address: mailbox.messagingKeyParams.address,
			protocol: mailbox.messagingKeyParams.protocol,
			network: mailbox.messagingKeyParams.network,
			nonce: mailbox.messagingKeyParams.nonce,
		});
		await this.internalUpdateMailbox(mailboxId, protoAddress, CURRENT_ADDRESS_VERSION);
		return { id: mailboxId, type: 'wallet', ...mailbox };
	}

	private async internalUpdateMailbox(
		addressId: string,
		protoAddress: user.Address,
		version: number,
	): Promise<user.Address> {
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		await this.userApi.putUserAddress(addressId, { encryptedAddressInformation: encodeBase64(encrypted), version });
		return protoAddress;
	}

	async removeMailbox(mailboxId: string): Promise<void> {
		await this.userApi.deleteUserAddress(mailboxId);
		return;
	}
}
