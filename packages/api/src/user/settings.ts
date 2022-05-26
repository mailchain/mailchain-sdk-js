import { KeyRing } from '@mailchain/keyring';
import axios from 'axios';
import { initializeHeader } from '../auth/jwt';
import { Configuration } from '../api/configuration';
import { SettingsApiFactory } from '../api';

export async function getSettings(apiConfig: Configuration, kr?: KeyRing) {
	if (kr !== undefined) initializeHeader(kr);
	const settingsFactory = SettingsApiFactory(apiConfig, undefined, axios);
	const { data } = await settingsFactory.getUserSettings();
	return data.settings;
}

export async function setSetting(key: string, value: string, apiConfig: Configuration, kr?: KeyRing) {
	if (kr !== undefined) initializeHeader(kr);
	const settingsFactory = SettingsApiFactory(apiConfig, undefined, axios);
	return settingsFactory.putUserSetting(key, { value });
}
