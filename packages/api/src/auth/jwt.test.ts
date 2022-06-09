import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EncodeBase64, EncodeBase64UrlSafe } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { getToken, initializeHeader } from './jwt';

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
	const time = Math.floor(MS_IN_DATE * 0.001 + 86400);

	it('verify signing', async () => {
		expect.assertions(1);
		const jwtTokenForAlice = await getToken(new KeyRing(AliceED25519PrivateKey), payload, MS_IN_DATE);

		expect(jwtTokenForAlice).toEqual(expectedTokenForAlice);
	});

	it('verify axios request GET', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);
		initializeHeader(kr);

		const payloadGet = {
			m: 'GET',
			url: '/users',
			len: 0,
			aud: 'google.com',
		};

		const token = await getToken(kr, payloadGet, time);
		mock.onGet(`https://${payloadGet.aud}${payloadGet.url}`, { params: { searchText: 'John' } }).reply((conf) => [
			200,
			conf.headers,
		]);

		return axios
			.get(`https://${payloadGet.aud}${payloadGet.url}`, { params: { searchText: 'John' } })
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${EncodeBase64UrlSafe(kr.rootIdentityPublicKey().Bytes)}`,
				);
			});
	});

	it('verify axios request POST', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);
		const kr = new KeyRing(AliceED25519PrivateKey);
		initializeHeader(kr);

		const postBody = { scripts: { test: 'jest --passWithNoTests' } };
		const len = Buffer.byteLength(JSON.stringify(postBody));

		const payloadPost = {
			m: 'POST',
			url: '/posts/1/comments/23',
			len,
			aud: 'google.com',
		};

		const token = await getToken(kr, payloadPost, time);
		mock.onPost(`https://${payloadPost.aud}${payloadPost.url}`).reply((conf) => [200, conf.headers]);

		return axios.post(`https://${payloadPost.aud}${payloadPost.url}`, postBody).then((response) => {
			expect(response.data.Authorization).toEqual(
				`vapid t=${token}, k=${EncodeBase64UrlSafe(kr.rootIdentityPublicKey().Bytes)}`,
			);
		});
	});

	it('verify axios request PUT', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);
		initializeHeader(kr);

		const putBody = { dependencies: { axios: '^0.26.1' } };
		const len = Buffer.byteLength(JSON.stringify(putBody), 'ascii');

		const payloadPut = {
			m: 'PUT',
			url: '/posts/1/comments/23',
			len,
			aud: 'google.com',
		};

		const token = await getToken(kr, payloadPut, time);
		mock.onPut(`https://${payloadPut.aud}${payloadPut.url}`).reply((conf) => [200, conf.headers]);

		return axios
			.put(`https://${payloadPut.aud}${payloadPut.url}`, putBody, {
				params: { searchText: 'id=23&topic=main' },
			})
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${EncodeBase64UrlSafe(kr.rootIdentityPublicKey().Bytes)}`,
				);
			});
	});

	it('verify axios request PATCH', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);

		const kr = new KeyRing(AliceED25519PrivateKey);
		initializeHeader(kr);

		const patchBody = { dependencies: { axios: '^0.9.1' } };
		const len = Buffer.byteLength(JSON.stringify(patchBody), 'ascii');

		const payloadPatch = {
			m: 'PATCH',
			url: '/posts/1/comments/23/reactions/likes',
			len,
			aud: 'google.com',
		};

		const token = await getToken(kr, payloadPatch, time);
		mock.onPatch(`https://${payloadPatch.aud}${payloadPatch.url}`).reply((conf) => [200, conf.headers]);

		return axios
			.patch(`https://${payloadPatch.aud}${payloadPatch.url}`, patchBody, {
				params: { searchText: 'count=55' },
			})
			.then((response) => {
				expect(response.data.Authorization).toEqual(
					`vapid t=${token}, k=${EncodeBase64UrlSafe(kr.rootIdentityPublicKey().Bytes)}`,
				);
			});
	});
});
