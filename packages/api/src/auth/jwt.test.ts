import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { encodeBase64UrlSafe } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { getAxiosWithSigner, createSignedToken, verifySignedToken, createTokenPayload } from './jwt';

describe('createTokenPayload', () => {
	it('get', () => {
		const payload = createTokenPayload(new URL('https://example.com/users?id=1234'), 'GET', null);
		expect(payload).toEqual({
			m: 'GET',
			url: '/users',
			q: 'id=1234',
			len: 0,
			aud: 'example.com',
		});
	});
	it('post-object', () => {
		const postBody = { scripts: { test: 'test value' } };
		const len = Buffer.byteLength(JSON.stringify(postBody));
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', postBody);
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			len,
			aud: 'example.com',
		});
	});
	it('post-uint8array', () => {
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', Uint8Array.from([1, 2]));
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			len: 2,
			aud: 'example.com',
		});
	});
});

describe('createSignedToken', () => {
	const MS_IN_DATE = 1577836800;
	it('createSignedToken - get query string', async () => {
		const payload = {
			m: 'GET',
			url: '/users?id=1234',
			len: 0,
			aud: 'example.com',
		};
		const jwtTokenForAlice = await createSignedToken(AliceED25519PrivateKey, payload, MS_IN_DATE);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJtIjoiR0VUIiwidXJsIjoiL3VzZXJzP2lkPTEyMzQiLCJsZW4iOjAsImF1ZCI6ImV4YW1wbGUuY29tIiwiZXhwIjoxNTc3ODM2ODAwfQ.mKNaYiips6nSRx4UlsXJGKGC_0XeMC8agUo2SuxDMGylUUWoLUQ_ZqRHz7DWWTaIwDU0iCt2OdCvGWW_dv3XDg',
		);
	});
	it('createSignedToken - get', async () => {
		const payload = {
			m: 'GET',
			url: '/users/settings',
			len: 0,
			aud: 'mailchain.com',
		};
		const jwtTokenForAlice = await createSignedToken(AliceED25519PrivateKey, payload, MS_IN_DATE);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJtIjoiR0VUIiwidXJsIjoiL3VzZXJzL3NldHRpbmdzIiwibGVuIjowLCJhdWQiOiJtYWlsY2hhaW4uY29tIiwiZXhwIjoxNTc3ODM2ODAwfQ.kddbP_WWDwMEkXevFHCDbJhVTLVkbF33XNy8yRA5-9MJIQWUj97oJ2FuLz7vTHVJRCjnn0Ywvd8AL-t-zbGvDA',
		);
	});
});

describe('verifySignedToken', () => {
	it('verifySignedToken', async () => {
		const jwtTokenForAlice =
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJtIjoiR0VUIiwidXJsIjoiL3VzZXJzP2lkPTEyMzQiLCJsZW4iOjAsImF1ZCI6ImV4YW1wbGUuY29tIiwiZXhwIjoxNTc3ODM2ODAwfQ.mKNaYiips6nSRx4UlsXJGKGC_0XeMC8agUo2SuxDMGylUUWoLUQ_ZqRHz7DWWTaIwDU0iCt2OdCvGWW_dv3XDg';
		const verified = await verifySignedToken(jwtTokenForAlice, AliceED25519PrivateKey.publicKey);

		expect(verified).toEqual(true);
	});
});

describe('getAxiosWithSigner', () => {
	const MS_IN_DATE = 1577836800;
	const time = Math.floor(MS_IN_DATE * 0.001 + 60 * 5);

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
			len: 0,
			aud: 'mailchain.com',
		};

		const token = await createSignedToken(kr.accountIdentityKey(), payloadGet, time);

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
			len: 0,
			aud: 'mailchain.com',
			q: 'visible=false&test=1',
		};

		const token = await createSignedToken(kr.accountIdentityKey(), payloadGet, time);
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
		const kr = new KeyRing(AliceED25519PrivateKey);

		const postBody = { scripts: { test: 'test value' } };
		const len = Buffer.byteLength(JSON.stringify(postBody));

		const payloadPost = {
			m: 'POST',
			url: '/users/settings',
			len,
			aud: 'mailchain.com',
		};

		const token = await createSignedToken(kr.accountIdentityKey(), payloadPost, time);
		mock.onPost(`https://${payloadPost.aud}${payloadPost.url}`).reply((conf) => [200, conf.headers]);

		return getAxiosWithSigner(kr.accountIdentityKey())
			.post(`https://${payloadPost.aud}${payloadPost.url}`, postBody)
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${encodeBase64UrlSafe(kr.accountIdentityKey().publicKey.bytes)}`,
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

		const token = await createSignedToken(kr.accountMessagingKey(), payloadPut, time);
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

		const token = await createSignedToken(kr.accountIdentityKey(), payloadPut, time);
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

		const token = await createSignedToken(kr.accountIdentityKey(), payloadPatch, time);
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
