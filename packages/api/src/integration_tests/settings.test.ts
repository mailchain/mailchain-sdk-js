import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EncodeBase64 } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { getSettings, setSetting } from '../user/settings';
import { Configuration, ConfigurationParameters } from '../api';

const apiConfig = new Configuration({ basePath: 'http://localhost:8080' } as ConfigurationParameters);
const kr = new KeyRing(AliceED25519PrivateKey);
describe('Settings', () => {
	afterAll(() => jest.resetAllMocks());

	it('get settings', async () => {
		const data = await getSettings(apiConfig, kr);
		expect(data).toBeDefined();
	});

	it('set settings', async () => {
		const date = `${Date.now()}`;
		setSetting('lastTestDate', date, apiConfig);
		const data = await getSettings(apiConfig, kr);
		expect(data!['lastTestDate']).toEqual(date);
	});
});
