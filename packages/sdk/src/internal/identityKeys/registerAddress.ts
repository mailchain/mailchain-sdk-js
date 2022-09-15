import { encodePublicKey, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { IdentityKeysApiFactory, PutMsgKeyByIDKeyRequestBody } from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { Configuration } from '../../mailchain';

type RegisterAddressParams = PutMsgKeyByIDKeyRequestBody & { identityKey: PublicKey };

export async function registerAddress(config: Configuration, params: RegisterAddressParams) {
	const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config));

	const identityKey = encodeHexZeroX(encodePublicKey(params.identityKey));

	return identityKeysApi.putMsgKeyByIDKey(identityKey, params);
}
