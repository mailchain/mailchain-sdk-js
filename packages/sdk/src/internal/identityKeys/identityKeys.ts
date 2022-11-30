import { formatAddress, MailchainAddress, ProtocolType } from '@mailchain/addressing';
import { decodePublicKey, encodePublicKey, PublicKey } from '@mailchain/crypto';
import { decodeHexZeroX, encodeHexZeroX } from '@mailchain/encoding';
import Axios from 'axios';
import { Configuration } from '../../mailchain';
import {
	AddressesApiFactory,
	AddressesApiInterface,
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
	PutMsgKeyByIDKeyRequestBody,
} from '../api';
import { createAxiosConfiguration } from '../axios/config';

export class IdentityKeys {
	constructor(
		private readonly addressesApi: AddressesApiInterface,
		private readonly identityKeysApi: IdentityKeysApiInterface,
	) {}

	static create(config: Configuration) {
		return new IdentityKeys(
			AddressesApiFactory(createAxiosConfiguration(config)),
			IdentityKeysApiFactory(createAxiosConfiguration(config)),
		);
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

	async putAddressMessagingKey(
		addressProofParams: PutMsgKeyByIDKeyRequestBody,
		identityKey: PublicKey,
	): Promise<void> {
		const encodedIdentityKey = encodeHexZeroX(encodePublicKey(identityKey));
		await this.identityKeysApi.putMsgKeyByIDKey(encodedIdentityKey, addressProofParams);
	}
}
