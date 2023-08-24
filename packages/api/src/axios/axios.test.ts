import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { encodeBase64UrlSafe } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { signJWT } from '../jwt';
import { getAxiosWithSigner } from './axios';
import { createTokenPayload } from './token';

describe('getAxiosWithSigner', () => {
	const MS_IN_DATE = 1577836800;
	const exp = Math.floor(MS_IN_DATE * 0.001 + 60 * 5);

	afterAll(() => {
		jest.resetAllMocks();
		jest.clearAllTimers();
	});
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(MS_IN_DATE));
	});
	it('axios request GET', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const payloadGet = {
			m: 'GET',
			url: '/users/settings',
			aud: 'mailchain.com',
			exp,
		};

		const token = await signJWT(kr.accountIdentityKey(), payloadGet);

		mock.onGet(`https://mailchain.com/users/settings`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.get(`https://mailchain.com/users/settings`)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('axios request GET query string', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const payloadGet = {
			m: 'GET',
			url: '/users/settings',
			aud: 'mailchain.com',
			q: 'visible=false&test=1',
			exp,
		};

		const token = await signJWT(kr.accountIdentityKey(), payloadGet);
		mock.onGet(`https://mailchain.com/users/settings?visible=false&test=1`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.get(`https://mailchain.com/users/settings?visible=false&test=1`)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('axios request POST', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const postBody = { scripts: { test: 'test value' } };

		const token = await signJWT(
			AliceED25519PrivateKey,
			createTokenPayload(new URL('https://mailchain.com/user/settings'), 'post', postBody, exp),
		);
		mock.onPost('https://mailchain.com/user/settings').reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(AliceED25519PrivateKey)
			.post('https://mailchain.com/user/settings', postBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(AliceED25519PrivateKey.publicKey.bytes)}`,
				);
			});
	});

	it('axios request signed with message key', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const putBody = { dependencies: { axios: '^0.26.1' } };
		const len = Buffer.byteLength(JSON.stringify(putBody), 'ascii');

		const payloadPut = {
			m: 'PUT',
			url: '/transport/delivery-requests',
			len,
			aud: 'mailchain.com',
		};

		const token = await signJWT(
			kr.accountMessagingKey(),
			createTokenPayload(new URL('https://mailchain.com/transport/delivery-requests'), 'put', putBody, exp),
		);
		mock.onPut(`https://${payloadPut.aud}${payloadPut.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountMessagingKey())
			.put(`https://${payloadPut.aud}${payloadPut.url}`, putBody, {
				params: { searchText: 'id=23&topic=main' },
			})
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountMessagingKey().publicKey.bytes)}`,
				);
			});
	});

	it('axios request PUT', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const putBody = { dependencies: { axios: '^0.26.1' } };
		const len = Buffer.byteLength(JSON.stringify(putBody), 'ascii');

		const payloadPut = {
			m: 'PUT',
			url: '/user',
			len,
			aud: 'mailchain.com',
		};

		const token = await signJWT(
			kr.accountIdentityKey(),
			createTokenPayload(new URL('https://mailchain.com/user'), 'put', putBody, exp),
		);

		mock.onPut(`https://${payloadPut.aud}${payloadPut.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.put(`https://${payloadPut.aud}${payloadPut.url}`, putBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('axios request PATCH', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const patchBody = { dependencies: { axios: '^0.9.1' } };
		const len = Buffer.byteLength(JSON.stringify(patchBody), 'ascii');

		const payloadPatch = {
			m: 'PATCH',
			url: '/user',
			len,
			aud: 'mailchain.com',
		};

		const token = await signJWT(
			kr.accountIdentityKey(),
			createTokenPayload(new URL('https://mailchain.com/user'), 'patch', patchBody, exp),
		);

		mock.onPatch(`https://${payloadPatch.aud}${payloadPatch.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.patch(`https://${payloadPatch.aud}${payloadPatch.url}`, patchBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});
});
