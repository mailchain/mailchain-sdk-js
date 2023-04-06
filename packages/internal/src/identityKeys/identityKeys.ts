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

	async getAddressIdentityKey(address: MailchainAddress) {
		return this.resolve(formatAddress(address, 'mail'));
	}

	async resolve(address: string): Promise<{ identityKey: PublicKey; protocol: ProtocolType } | null> {
		return this.addressesApi
			.getAddressIdentityKey(address)
			.then(({ data }) => ({
				identityKey: publicKeyFromBytes(decodeHexZeroX(data.identityKey)),
				protocol: data.protocol as ProtocolType,
			}))
			.catch((e) => {
				if (Axios.isAxiosError(e)) {
					if (e.response?.data?.message === 'address not found') {
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
