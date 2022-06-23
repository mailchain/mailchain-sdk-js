import { getAxiosWithSigner } from '../auth/jwt';
import { Configuration } from '../api/configuration';
import { UserApiFactory } from '../api';
import { SignerWithPublicKey } from '@mailchain/crypto';

export async function getSettings(apiConfig: Configuration, signer: SignerWithPublicKey) {
	const settingsFactory = UserApiFactory(apiConfig, undefined, getAxiosWithSigner(signer));

	const { data } = await settingsFactory.getUserSettings();
	return data.settings;
}

export async function setSetting(key: string, value: string, apiConfig: Configuration, signer: SignerWithPublicKey) {
	const settingsFactory = UserApiFactory(apiConfig, undefined, getAxiosWithSigner(signer));
	return settingsFactory.putUserSetting(key, { value });
}
