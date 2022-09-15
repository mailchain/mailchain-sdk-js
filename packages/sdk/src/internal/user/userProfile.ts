import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { decodeAddressByProtocol, encodeAddressByProtocol, ProtocolType } from '@mailchain/addressing';
import { decodePublicKey, Decrypter, encodePublicKey, Encrypter, SignerWithPublicKey } from '@mailchain/crypto';
import { AxiosError } from 'axios';
import { user } from '../protobuf/user/user';
import { AddressesApiFactory, Setting, UserApiFactory, UserApiInterface } from '../api';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';
import { getAxiosWithSigner } from '../auth/jwt';
import { combineMigrations } from '../migration';
import { Address } from './address';
import { createV1V2IdentityKeyMigration, UserAddressMigrationRule } from './migrations';

export type UserSettings = { [key: string]: Setting | undefined };

export class UserNotFoundError extends Error {
	constructor() {
		super(`user not found for provided key`);
	}
}

const CURRENT_ADDRESS_VERSION = 2 as const;

type NewAddress = Omit<Address, 'id'>;
export interface UserProfile {
	addresses(): Promise<Address[]>;
	addAddress(address: NewAddress): Promise<Address>;
	updateAddress(addressId: string, address: NewAddress): Promise<Address>;
	deleteAddress(addressId: string): Promise<void>;
	getSettings(): Promise<UserSettings>;
	setSetting(key: string, value: string): Promise<void>;
	getUsername(): Promise<{ username: string; address: string }>;
}

export class MailchainUserProfile implements UserProfile {
	constructor(
		private readonly userApi: UserApiInterface,
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
		return new MailchainUserProfile(userApi, addressCrypto, migrations);
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

	async addresses(): Promise<Address[]> {
		const { addresses } = await this.userApi.getUserAddresses().then((r) => r.data);
		const resultAddresses: Address[] = [];
		for (const apiAddress of addresses) {
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

			if (originalAddressData.version !== addressData.version) {
				// TODO another PR: put update userProfile.update(...)
			}

			const { protoAddress } = addressData;
			const protocol = protoAddress.protocol as ProtocolType;
			const encodedAddress = encodeAddressByProtocol(protoAddress.address!, protocol).encoded;

			resultAddresses.push({
				id: apiAddress.addressId!,
				address: encodedAddress,
				identityKey: decodePublicKey(protoAddress.identityKey),
				nonce: protoAddress.nonce,
				protocol,
				network: protoAddress.network,
			});
		}

		return resultAddresses;
	}

	async addAddress(address: NewAddress): Promise<Address> {
		const protoAddress = user.Address.create({
			identityKey: encodePublicKey(address.identityKey),
			address: decodeAddressByProtocol(address.address, address.protocol).decoded,
			nonce: address.nonce,
			protocol: address.protocol,
			network: address.network,
		});
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		const { addressId } = await this.userApi
			.postUserAddress({ encryptedAddressInformation: encodeBase64(encrypted), version: CURRENT_ADDRESS_VERSION })
			.then((res) => res.data);

		return { ...address, id: addressId! };
	}

	async updateAddress(addressId: string, address: NewAddress): Promise<Address> {
		const protoAddress = user.Address.create({
			identityKey: encodePublicKey(address.identityKey),
			address: decodeAddressByProtocol(address.address, address.protocol).decoded,
			nonce: address.nonce,
			protocol: address.protocol,
			network: address.network,
		});
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		await this.userApi.putUserAddress(addressId, {
			encryptedAddressInformation: encodeBase64(encrypted),
			version: CURRENT_ADDRESS_VERSION,
		});
		return { id: addressId, ...address };
	}

	async deleteAddress(addressId: string): Promise<void> {
		await this.userApi.deleteUserAddress(addressId);
		return;
	}
}
