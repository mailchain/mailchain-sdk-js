import { Setting, UserApiFactory, UserApiInterface } from '@mailchain/sdk/internal/api';
import { Address } from '@mailchain/sdk/internal/user/address';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { protocols } from '@mailchain/internal';
import { user } from '@mailchain/sdk/internal/protobuf/user/user';
import { decodeAddressByProtocol, encodeAddressByProtocol } from '@mailchain/internal/addressing';
import { Decrypter, Encrypter, SignerWithPublicKey } from '@mailchain/crypto';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';
import { getAxiosWithSigner } from '../auth/jwt';

type NewAddress = Omit<Address, 'id'>;
export interface UserProfile {
	addresses(): Promise<Address[]>;
	addAddress(address: NewAddress): Promise<Address>;
	updateAddress(address: Address, newNonce: number): Promise<Address>;
	deleteAddress(addressId: string): Promise<void>;
	getSettings(): Promise<{ [key: string]: Setting }>;
	setSetting(key: string, value: string): Promise<void>;
	getUsername(): Promise<{ username: string; address: string }>;
}

export class MailchainUserProfile implements UserProfile {
	private constructor(
		private readonly userApi: UserApiInterface,
		private readonly addressCrypto: Encrypter & Decrypter,
	) {}

	static create(
		configuration: Configuration,
		accountIdentityKey: SignerWithPublicKey,
		addressCrypto: Encrypter & Decrypter,
	): MailchainUserProfile {
		return new this(
			UserApiFactory(createAxiosConfiguration(configuration), undefined, getAxiosWithSigner(accountIdentityKey)),
			addressCrypto,
		);
	}

	async getUsername() {
		const { data } = await this.userApi.getUsername();
		return {
			address: data.address,
			username: data.username,
		};
	}

	async setSetting(key: string, value: string) {
		await this.userApi.putUserSetting(key, { value });
	}

	async getSettings(): Promise<{ [key: string]: Setting }> {
		const { data } = await this.userApi.getUserSettings();
		return data.settings ?? {};
	}

	async addresses(): Promise<Address[]> {
		const { addresses } = await this.userApi.getUserAddresses().then((r) => r.data);
		if (addresses) {
			const resultAddresses: Address[] = [];
			for (const address of addresses) {
				const decryptedAddress = await this.addressCrypto.decrypt(
					decodeBase64(address.encryptedAddressInformation),
				);
				const protoAddress = user.Address.decode(decryptedAddress);
				const protocol = protoAddress.protocol as protocols.ProtocolType;
				resultAddresses.push({
					id: address.addressId!,
					address: encodeAddressByProtocol(protoAddress.address!, protocol).encoded,
					nonce: protoAddress.nonce,
					protocol,
					network: protoAddress.network,
				});
			}
			return resultAddresses;
		}
		return [];
	}

	async addAddress(address: NewAddress): Promise<Address> {
		const protoAddress = user.Address.create({
			address: decodeAddressByProtocol(address.address, address.protocol).decoded,
			nonce: address.nonce,
			protocol: address.protocol,
			network: address.network,
		});
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		const { addressId } = await this.userApi
			.postUserAddress({ encryptedAddressInformation: encodeBase64(encrypted) })
			.then((res) => res.data);
		return { ...address, id: addressId! };
	}

	async updateAddress(address: Address, newNonce: number): Promise<Address> {
		const protoAddress = user.Address.create({
			address: decodeAddressByProtocol(address.address, address.protocol).decoded,
			nonce: newNonce,
			protocol: address.protocol,
			network: address.network,
		});
		const encrypted = await this.addressCrypto.encrypt(user.Address.encode(protoAddress).finish());
		await this.userApi.putUserAddress(address.id, { encryptedAddressInformation: encodeBase64(encrypted) });
		return { ...address, nonce: newNonce };
	}

	async deleteAddress(addressId: string): Promise<void> {
		await this.userApi.deleteUserAddress(addressId);
		return;
	}
}
