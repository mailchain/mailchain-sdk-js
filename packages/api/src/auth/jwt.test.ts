import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EncodeBase64 } from '@mailchain/encoding';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { getToken, initializeHeader } from './jwt';
import { KeyRing } from '@mailchain/keyring';

const payload = {
	m: 'GET',
	url: '/user/settings',
	len: 0,
	aud: 'localhost:7006',
};

const expectedTokenForAlice =
	'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJtIjoiR0VUIiwidXJsIjoiL3VzZXIvc2V0dGluZ3MiLCJsZW4iOjAsImF1ZCI6ImxvY2FsaG9zdDo3MDA2IiwiZXhwIjoxOTY2NDkxOTAzfQ.ECwd4VQhV2AsUY5v1vt5xeQ6l92Toh4u7nhKZqXKsr9TMZNyzxnbzEmOkCuNvVjEHLm-pqAvHCGUCEAtJW6uAw';

describe('JWT tokens()', () => {
	afterAll(() => jest.resetAllMocks());

	const MS_IN_DATE = 1966491903;
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
					`vapid t=${token}, k=${EncodeBase64(kr.rootIdentityPublicKey().Bytes)}`,
				);
			});
	});

	it('verify axios request POST', async () => {
		expect.assertions(1);
		const mock = new MockAdapter(axios);
		const kr = new KeyRing(AliceED25519PrivateKey);
		initializeHeader(kr);

		const postBody = { scripts: { test: 'jest --passWithNoTests' } };
		const len = Buffer.byteLength(JSON.stringify(postBody), 'ascii');

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
				`vapid t=${token}, k=${EncodeBase64(kr.rootIdentityPublicKey().Bytes)}`,
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
					`vapid t=${token}, k=${EncodeBase64(kr.rootIdentityPublicKey().Bytes)}`,
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
					`vapid t=${token}, k=${EncodeBase64(kr.rootIdentityPublicKey().Bytes)}`,
				);
			});
	});
});
