import { ETHEREUM, ProtocolType } from '@mailchain/internal/protocols';
import axios from 'axios';
import {
	Configuration,
	IdentityKeysApi,
	IdentityKeysApiFactory,
	MessagingKeysApi,
	MessagingKeysApiFactory,
} from '../api';

export async function getAddressNonce(apiConfig: Configuration, address: string, protocol: ProtocolType) {
	const identityKeysApi = IdentityKeysApiFactory(apiConfig);
	const messagingKeysApi = MessagingKeysApiFactory(apiConfig);

	return _getAddressNonce(
		identityKeysApi as IdentityKeysApi,
		messagingKeysApi as MessagingKeysApi,
		address,
		protocol,
	);
}

export async function _getAddressNonce(
	identityKeysApi: IdentityKeysApi,
	messagingKeysApi: MessagingKeysApi,
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
