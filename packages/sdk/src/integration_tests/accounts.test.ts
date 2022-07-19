/* eslint-disable no-console */

import { OpaqueID, getOpaqueConfig } from '@cloudflare/opaque-ts';
import { secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase58 } from '@mailchain/encoding';
import axios from 'axios';
import { KeyRing } from '@mailchain/keyring';
import { Configuration, ConfigurationParameters, UserApi, UserApiFactory } from '../api';
import { OpaqueConfig } from '../types';
import { Login } from '../auth/login';
import { Register } from '../auth/register';
import { getAxiosWithSigner } from '../auth/jwt';

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
	// console.log(params);

	const config = {
		parameters: params,
		serverIdentity: 'Mailchain',
		context: 'MailchainAuthentication',
	} as OpaqueConfig;

	const username = EncodeBase58(secureRandom(8)).toLowerCase();
	let registrationResponse;
	let rootAccountKey;
	it('register', async () => {
		const seed = secureRandom(32);

		rootAccountKey = ED25519PrivateKey.fromSeed(seed);
		const keyRing = KeyRing.fromPrivateKey(rootAccountKey);

		registrationResponse = await Register({
			identityKeySeed: seed,
			username,
			password: 'qwerty',
			captchaResponse: 'captcha',
			messagingPublicKey: keyRing.accountMessagingKey().publicKey,
			apiConfig,
			opaqueConfig: config,
		});
	});
	it('login', async () => {
		const loginResponse = await Login(username, 'qwerty', 'captcha', apiConfig, config);

		expect(registrationResponse.clientSecretKey).toEqual(loginResponse.clientSecretKey);
		expect(rootAccountKey).toEqual(loginResponse.rootAccountKey);

		// login again
		const secondLoginResponse = await Login(username, 'qwerty', 'catpcha', apiConfig, config);
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
