/* eslint-disable no-console */

import { OpaqueID, getOpaqueConfig } from '@cloudflare/opaque-ts';
import { SecureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase58 } from '@mailchain/encoding';
import axios from 'axios';
import { Configuration, ConfigurationParameters } from '../api';
import { OpaqueConfig } from '../types';
import { Login } from '../auth/login';
import { Register } from '../auth/register';

describe('accounts', () => {
	axios.interceptors.request.use((request) => {
		console.log('Starting Request', JSON.stringify(request, null, 2));
		return request;
	});

	axios.interceptors.response.use((response) => {
		console.log('Response:', JSON.stringify(response, null, 2));
		return response;
	});

	const apiConfig = new Configuration({ basePath: 'http://localhost:8080' } as ConfigurationParameters);
	const params = getOpaqueConfig(OpaqueID.OPAQUE_P256);
	console.log(params);

	const config = {
		parameters: params,
		serverIdentity: 'Mailchain',
		context: 'MailchainAuthentication',
	} as OpaqueConfig;
	it('register-then-login', async () => {
		const username = EncodeBase58(SecureRandom(8)).toLowerCase();
		const seed = SecureRandom(32);

		const identityKey = ED25519PrivateKey.FromSeed(seed);
		const registrationResponse = await Register(seed, username, 'qwerty', apiConfig, config);
		const loginResponse = await Login(username, 'qwerty', apiConfig, config);

		expect(registrationResponse.clientSecretKey).toEqual(loginResponse.clientSecretKey);
		expect(identityKey).toEqual(loginResponse.identityKey);

		// login again
		const secondLoginResponse = await Login(username, 'qwerty', apiConfig, config);
		expect(registrationResponse.clientSecretKey).toEqual(secondLoginResponse.clientSecretKey);
		expect(identityKey).toEqual(secondLoginResponse.identityKey);
	});
});
