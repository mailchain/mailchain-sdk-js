import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { encodeBase64UrlSafe } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { getAxiosWithSigner, getToken } from './jwt';

const payload = {
	m: 'GET',
	url: '/users?id=1234',
	len: 0,
	aud: 'example.com',
};

const expectedTokenForAlice =
	'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJtIjoiR0VUIiwidXJsIjoiL3VzZXJzP2lkPTEyMzQiLCJsZW4iOjAsImF1ZCI6ImV4YW1wbGUuY29tIiwiZXhwIjoxNTc3ODM2ODAwfQ.CHnGh7f9K6cnmKqgZ2CsXqNEZvcRElIBGDo3qfJGuxKtC1pxgN9yx06twVe9vXeKkRwiCb5rDiSA7CyL9ub3Bw';

describe('JWT tokens()', () => {
	afterAll(() => jest.resetAllMocks());

	const MS_IN_DATE = 1577836800;
	Date.now = jest.fn(() => MS_IN_DATE);
	const time = Math.floor(MS_IN_DATE * 0.001 + 60 * 5);

	it('verify signing', async () => {
		expect.assertions(1);
		const jwtTokenForAlice = await getToken(
			new KeyRing(AliceED25519PrivateKey).accountIdentityKey(),
			payload,
			MS_IN_DATE,
		);

		expect(jwtTokenForAlice).toEqual(expectedTokenForAlice);
	});

	it('verify axios request GET', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const payloadGet = {
			m: 'GET',
			url: '/users/settings',
			len: 0,
			aud: 'mailchain.com',
		};

		const token = await getToken(kr.accountIdentityKey(), payloadGet, time);
		mock.onGet(`https://mailchain.com/users/settings`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.get(`https://mailchain.com/users/settings`)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('verify axios request GET query string', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);

		const payloadGet = {
			m: 'GET',
			url: '/users/settings',
			len: 0,
			aud: 'mailchain.com',
			q: 'visible=false&test=1',
		};

		const token = await getToken(kr.accountIdentityKey(), payloadGet, time);
		mock.onGet(`https://mailchain.com/users/settings?visible=false&test=1`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.get(`https://mailchain.com/users/settings?visible=false&test=1`)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('verify axios request POST', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);
		const kr = new KeyRing(AliceED25519PrivateKey);

		const postBody = { scripts: { test: 'test value' } };
		const len = Buffer.byteLength(JSON.stringify(postBody));

		const payloadPost = {
			m: 'POST',
			url: '/users/settings',
			len,
			aud: 'mailchain.com',
		};

		const token = await getToken(kr.accountIdentityKey(), payloadPost, time);
		mock.onPost(`https://${payloadPost.aud}${payloadPost.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.post(`https://${payloadPost.aud}${payloadPost.url}`, postBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('verify axios request signed with message key', async () => {
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

		const token = await getToken(kr.accountMessagingKey(), payloadPut, time);
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

	it('verify axios request PUT', async () => {
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

		const token = await getToken(kr.accountIdentityKey(), payloadPut, time);
		mock.onPut(`https://${payloadPut.aud}${payloadPut.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.put(`https://${payloadPut.aud}${payloadPut.url}`, putBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
				);
			});
	});

	it('verify axios request PATCH', async () => {
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

		const token = await getToken(kr.accountIdentityKey(), payloadPatch, time);
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
