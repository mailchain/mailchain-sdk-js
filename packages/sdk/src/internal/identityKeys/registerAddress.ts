import { IdentityKeysApiFactory, IdentityKeysApi } from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { Configuration } from '../../mailchain';

type RegisterAddressParams = Parameters<IdentityKeysApi['putMsgKeyByIDKey']>[1] & {
	identityKey: string;
};

export async function registerAddress(config: Configuration, params: RegisterAddressParams) {
	const identityKeysApi = IdentityKeysApiFactory(createAxiosConfiguration(config));

	return identityKeysApi.putMsgKeyByIDKey(params.identityKey, params);
}
