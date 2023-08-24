import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { createPayloadSegment, signJWT, verifyJWT } from './jwt';

describe('createPayloadSegment', () => {
	it('create with expires', async () => {
		expect(createPayloadSegment({ sub: 'test', exp: 1234 })).toEqual('eyJleHAiOjEyMzQsInN1YiI6InRlc3QifQ');
	});
	it('create without expires', async () => {
		expect(() => createPayloadSegment({ sub: 'test' })).toThrowError();
	});
	it('create with empty expires', async () => {
		expect(() => createPayloadSegment({ sub: 'test', exp: 0 })).toThrowError();
	});
});

describe('createSignedToken', () => {
	const now = new Date(1970, 0, 19, 6, 17, 16, 0);
	const expires = new Date(now.getTime() + 5 * 60000);
	it('createSignedToken - get query string', async () => {
		const payload = {
			m: 'GET',
			url: '/users?id=1234',
			aud: 'example.com',
			exp: expires.getTime() / 1000,
		};
		const jwtTokenForAlice = await signJWT(AliceED25519PrivateKey, payload);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJleGFtcGxlLmNvbSIsImV4cCI6MTU3ODEzNiwibSI6IkdFVCIsInVybCI6Ii91c2Vycz9pZD0xMjM0In0.m-HDyQOaW1JZXANi3-8loNcu8yI_bxcQm-nNgOJq5fau_JXAFiESrCsEnyL2wNY3AYh1x5W8ucNR2YawIw3tBQ',
		);
	});
	it('createSignedToken - get', async () => {
		const payload = {
			m: 'GET',
			url: '/users/settings',
			aud: 'mailchain.com',
			exp: expires.getTime() / 1000,
		};
		const jwtTokenForAlice = await signJWT(AliceED25519PrivateKey, payload);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJtYWlsY2hhaW4uY29tIiwiZXhwIjoxNTc4MTM2LCJtIjoiR0VUIiwidXJsIjoiL3VzZXJzL3NldHRpbmdzIn0.m6RZIuN6rrwCIlzBScqHi4J-3qIdEMsQQoQMik4B9-dn-RJd8nboPhE5YULnlhgZAyl9TeFtbA1PclXY_bhfBA',
		);
	});
});

describe('verifyJWT - expired', () => {
	const MS_IN_DATE = 1607836800;

	afterAll(() => {
		jest.resetAllMocks();
		jest.clearAllTimers();
	});
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(MS_IN_DATE));
	});
	it('expired token', async () => {
		const jwtTokenForAlice =
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJleGFtcGxlLmNvbSIsImV4cCI6MTU3ODEzNiwibSI6IkdFVCIsInVybCI6Ii91c2Vycz9pZD0xMjM0In0.m-HDyQOaW1JZXANi3-8loNcu8yI_bxcQm-nNgOJq5fau_JXAFiESrCsEnyL2wNY3AYh1x5W8ucNR2YawIw3tBQ';
		const verified = await verifyJWT(jwtTokenForAlice, AliceED25519PrivateKey.publicKey);

		expect(verified).toEqual(false);
	});
});

describe('verifyJWT - valid', () => {
	const MS_IN_DATE = 1577836800;

	afterAll(() => {
		jest.resetAllMocks();
		jest.clearAllTimers();
	});
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(MS_IN_DATE));
	});
	it('verifyJWT', async () => {
		const jwtTokenForAlice =
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJleGFtcGxlLmNvbSIsImV4cCI6MTU3NzgzNjgwMCwibSI6IkdFVCIsInVybCI6Ii91c2Vycz9pZD0xMjM0In0.zgSHXHKPw_ILGlfnjWpw6kcAbvxjZYFnVEfY4ztfxPkRRSquyOEjKHLhSqbrolxJR9h86Y5gkwOzhFbVuy9ACw';
		const verified = await verifyJWT(jwtTokenForAlice, AliceED25519PrivateKey.publicKey);

		expect(verified).toEqual(true);
	});
});
