/* eslint-disable no-console */

import { OpaqueID, getOpaqueConfig } from '@cloudflare/opaque-ts';
import { secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { encodeBase58 } from '@mailchain/encoding';
import axios from 'axios';
import { KeyRing } from '@mailchain/keyring';
import { Configuration, ConfigurationParameters, UserApi } from '../api';
import { OpaqueConfig } from '../types';
import { getAxiosWithSigner } from '../auth/jwt';
import { Authentication } from '../auth/auth';

jest.setTimeout(30000);
describe('full-auth-flow', () => {
	axios.interceptors.request.use((request) => {
		// console.log('Starting Request', JSON.stringify(request, null, 2));
		return request;
	});

	axios.interceptors.response.use((response) => {
		// console.log('Response:', JSON.stringify(response, null, 2));
		return response;
	});

	const apiConfig = new Configuration({ basePath: 'http://localhost:8080' } as ConfigurationParameters);
	const params = getOpaqueConfig(OpaqueID.OPAQUE_P256);
	const opaqueConfig = {
		parameters: params,
		serverIdentity: 'Mailchain',
		context: 'MailchainAuthentication',
	} as OpaqueConfig;
	const mailchainAuth = Authentication.create(apiConfig, opaqueConfig);
	// console.log(params);

	const username = encodeBase58(secureRandom(8)).toLowerCase();
	let registrationResponse;
	let rootAccountKey;
	it('register', async () => {
		const seed = secureRandom(32);

		rootAccountKey = ED25519PrivateKey.fromSeed(seed);
		registrationResponse = await mailchainAuth.register({
			username,
			password: 'qwerty',
			captcha: 'captcha',
			identityKeySeed: seed,
		});
	});
	it('login', async () => {
		const loginResponse = await mailchainAuth.login({ username, password: 'qwerty', captcha: 'captcha' });

		expect(registrationResponse.clientSecretKey).toEqual(loginResponse.clientSecretKey);
		expect(rootAccountKey).toEqual(loginResponse.rootAccountKey);

		// login again
		const secondLoginResponse = await mailchainAuth.login({ username, password: 'qwerty', captcha: 'catpcha' });
		expect(registrationResponse.clientSecretKey).toEqual(secondLoginResponse.clientSecretKey);
		expect(rootAccountKey).toEqual(secondLoginResponse.rootAccountKey);
	});
	it('getUsername', async () => {
		const keyRing = KeyRing.fromPrivateKey(rootAccountKey);
		const userApi = new UserApi(apiConfig, undefined, getAxiosWithSigner(keyRing.accountIdentityKey()));
		const response = await userApi.getUsername();
		expect(response.data.username).toEqual(username);
	});
});
