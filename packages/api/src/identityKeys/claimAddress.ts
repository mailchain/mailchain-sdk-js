import { IdentityKeysApiFactory, Configuration, IdentityKeysApi } from '../api';

type ClaimAddressParams = Parameters<IdentityKeysApi['putMsgKeyByIDKey']>[1] & {
	identityKey: string;
};

export async function claimAddress(apiConfig: Configuration, params: ClaimAddressParams) {
	const identityKeysApi = IdentityKeysApiFactory(apiConfig);

	return identityKeysApi.putMsgKeyByIDKey(params.identityKey, params);
}
