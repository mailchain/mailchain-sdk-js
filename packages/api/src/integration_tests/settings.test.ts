import { KeyRing } from '@mailchain/keyring';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { getSettings, setSetting } from '../user/settings';
import { Configuration, ConfigurationParameters } from '../api';

const apiConfig = new Configuration({ basePath: 'http://localhost:8080' } as ConfigurationParameters);

describe('Settings', () => {
	afterAll(() => jest.resetAllMocks());
	const kr = new KeyRing(ED25519PrivateKey.Generate());
	it('get settings', async () => {
		const data = await getSettings(apiConfig, kr.accountIdentityKey());
		expect(data).toBeDefined();
		expect(data!['theme'].value).toEqual('system');
		expect(data!['theme'].isSet).toBeFalsy();
	});

	it('set settings', async () => {
		setSetting('theme', 'dark', apiConfig, kr.accountIdentityKey());
		const data = await getSettings(apiConfig, kr.accountIdentityKey());
		expect(data!['theme'].value).toEqual('dark');
		expect(data!['theme'].isSet).toBeTruthy();
	});
});
