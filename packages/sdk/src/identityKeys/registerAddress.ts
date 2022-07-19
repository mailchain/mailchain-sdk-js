import { IdentityKeysApiFactory, Configuration, IdentityKeysApi } from '../api';

type RegisterAddressParams = Parameters<IdentityKeysApi['putMsgKeyByIDKey']>[1] & {
	identityKey: string;
};

export async function registerAddress(apiConfig: Configuration, params: RegisterAddressParams) {
	const identityKeysApi = IdentityKeysApiFactory(apiConfig);

	return identityKeysApi.putMsgKeyByIDKey(params.identityKey, params);
}
