import { ETHEREUM, ProtocolType } from '@mailchain/addressing';
import axios from 'axios';
import {
	IdentityKeysApiFactory,
	IdentityKeysApiInterface,
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
} from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { Configuration } from '../../mailchain';

export async function getAddressNonce(config: Configuration, address: string, protocol: ProtocolType) {
	const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config));
	const messagingKeysApi = MessagingKeysApiFactory(createAxiosConfiguration(config));

	return getAddressNonceWithFactories(identityKeysApi, messagingKeysApi, address, protocol);
}

export async function getAddressNonceWithFactories(
	identityKeysApi: IdentityKeysApiInterface,
	messagingKeysApi: MessagingKeysApiInterface,
	address: string,
	protocol: ProtocolType,
) {
	if (protocol !== ETHEREUM) throw new Error(`Unsupported protocol of [${protocol}]. Only [${ETHEREUM}] supported.`);
	try {
		const { identityKey } = await identityKeysApi.getIdentityKey(address, protocol).then((res) => res.data);

		return await messagingKeysApi.getIdentityKeyNonce(identityKey!).then((res) => res.data.nonce ?? 0);
	} catch (e) {
		if (axios.isAxiosError(e)) {
			if (e.response?.status === 404) return 0; // in case of 404 for identity key, current nonce of 0 is expected
		}
		throw e;
	}
}
