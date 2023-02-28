import { formatAddress, MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { encodePublicKey, PublicKey } from '@mailchain/crypto';
import Axios from 'axios';
import {
	AddressesApiFactory,
	AddressesApiInterface,
	createAxiosConfiguration,
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
} from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { encodeHexZeroX } from '@mailchain/encoding';
import { Configuration } from '../mailchain';

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
				identityKey: convertPublic(data.identityKey),
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
			await this.identityKeyApi.getIdentityKeyAddresses(encodeHexZeroX(encodePublicKey(identityKey)))
		).data;

		return addresses;
	}
}
