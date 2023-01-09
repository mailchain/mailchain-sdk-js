import { formatAddress, MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { decodePublicKey, PublicKey } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';
import Axios from 'axios';
import { AddressesApiFactory, AddressesApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../../mailchain';

export class IdentityKeys {
	constructor(private readonly addressesApi: AddressesApiInterface) {}

	static create(config: Configuration) {
		return new IdentityKeys(AddressesApiFactory(createAxiosConfiguration(config.apiPath)));
	}

	async getAddressIdentityKey(
		address: MailchainAddress,
	): Promise<{ identityKey: PublicKey; protocol: ProtocolType } | null> {
		return this.addressesApi
			.getAddressIdentityKey(formatAddress(address, 'mail'))
			.then(({ data }) => ({
				identityKey: decodePublicKey(decodeHexZeroX(data.identityKey)),
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
}
