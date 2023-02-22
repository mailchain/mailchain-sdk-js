import { ETHEREUM, ProtocolType } from '@mailchain/addressing';
import axios from 'axios';
import {
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
	createAxiosConfiguration,
} from '@mailchain/api';
import { Configuration } from '../mailchain';

export class MessagingKeyNonces {
	constructor(
		private readonly messagingKeysApi: MessagingKeysApiInterface,
		private readonly identityKeysApi: IdentityKeysApiInterface,
	) {}

	static create(configuration: Configuration) {
		return new MessagingKeyNonces(
			MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			IdentityKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
		);
	}

	async getAddressNonce(address: string, protocol: ProtocolType) {
		if (protocol !== ETHEREUM)
			throw new Error(`Unsupported protocol of [${protocol}]. Only [${ETHEREUM}] supported.`);
		try {
			const { identityKey } = await this.identityKeysApi
				.getIdentityKey(address, protocol)
				.then((res) => res.data);

			return await this.messagingKeysApi.getIdentityKeyNonce(identityKey!).then((res) => res.data.nonce ?? 0);
		} catch (e) {
			if (axios.isAxiosError(e)) {
				if (e.response?.status === 404) return 0; // in case of 404 for identity key, current nonce of 0 is expected
			}
			throw e;
		}
	}
}
