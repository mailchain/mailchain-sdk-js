import { KeyRing } from '@mailchain/keyring';
import { getAxiosWithSigner } from '../auth/jwt';
import { Configuration } from '../api/configuration';
import { UserApiFactory } from '../api';

export async function getSettings(apiConfig: Configuration, kr: KeyRing) {
	const settingsFactory = UserApiFactory(apiConfig, undefined, getAxiosWithSigner(kr.accountIdentityKey()));

	const { data } = await settingsFactory.getUserSettings();
	return data.settings;
}

export async function setSetting(key: string, value: string, apiConfig: Configuration, kr: KeyRing) {
	const settingsFactory = UserApiFactory(apiConfig, undefined, getAxiosWithSigner(kr.accountIdentityKey()));
	return settingsFactory.putUserSetting(key, { value });
}
