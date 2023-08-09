import { formatAddress, MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { publicKeyFromBytes, publicKeyToBytes, PublicKey } from '@mailchain/crypto';
import Axios from 'axios';
import {
	AddressesApiFactory,
	AddressesApiInterface,
	createAxiosConfiguration,
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
} from '@mailchain/api';
import { decodeHexZeroX, encodeHexZeroX } from '@mailchain/encoding';
import { Configuration } from '../configuration';

export class IdentityKeys {
	constructor(
		private readonly addressesApi: AddressesApiInterface,
		private readonly identityKeyApi: IdentityKeysApiInterface,
	) {}

	static create(config: Configuration) {
		const axiosConfig = createAxiosConfiguration(config.apiPath);
		return new IdentityKeys(AddressesApiFactory(axiosConfig), IdentityKeysApiFactory(axiosConfig));
	}

	async getAddressIdentityKey(address: MailchainAddress, at?: Date) {
		return this.resolve(formatAddress(address, 'mail'), at);
	}

	async resolve(address: string, at?: Date): Promise<{ identityKey: PublicKey; protocol: ProtocolType } | null> {
		const atDate: number | undefined = at ? Math.round(at.getTime() / 1000) : undefined;
		return this.addressesApi
			.getAddressIdentityKey(address, atDate)
			.then(({ data }) => ({
				identityKey: publicKeyFromBytes(decodeHexZeroX(data.identityKey)),
				protocol: data.protocol as ProtocolType,
			}))
			.catch((e) => {
				if (Axios.isAxiosError(e)) {
					if (e.response?.data.code === 'identity_not_found') {
						return null;
					} else if (e.response?.status === 404) {
						return null;
					}
				}
				throw e;
			});
	}

	async reverse(identityKey: PublicKey) {
		const { addresses } = (
			await this.identityKeyApi.getIdentityKeyAddresses(encodeHexZeroX(publicKeyToBytes(identityKey)))
		).data;

		return addresses;
	}
}
