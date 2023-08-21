import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { signJWT, verifyJWT } from './jwt';

describe('createSignedToken', () => {
	const MS_IN_DATE = 1577836800;
	it('createSignedToken - get query string', async () => {
		const payload = {
			m: 'GET',
			url: '/users?id=1234',
			aud: 'example.com',
		};
		const jwtTokenForAlice = await signJWT(AliceED25519PrivateKey, payload, MS_IN_DATE);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJleGFtcGxlLmNvbSIsImV4cCI6MTU3NzgzNjgwMCwibSI6IkdFVCIsInVybCI6Ii91c2Vycz9pZD0xMjM0In0.zgSHXHKPw_ILGlfnjWpw6kcAbvxjZYFnVEfY4ztfxPkRRSquyOEjKHLhSqbrolxJR9h86Y5gkwOzhFbVuy9ACw',
		);
	});
	it('createSignedToken - get', async () => {
		const payload = {
			m: 'GET',
			url: '/users/settings',
			aud: 'mailchain.com',
		};
		const jwtTokenForAlice = await signJWT(AliceED25519PrivateKey, payload, MS_IN_DATE);

		expect(jwtTokenForAlice).toEqual(
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJtYWlsY2hhaW4uY29tIiwiZXhwIjoxNTc3ODM2ODAwLCJtIjoiR0VUIiwidXJsIjoiL3VzZXJzL3NldHRpbmdzIn0.mPDGCoiEo22kXRj2ebB_EwwrXqxm-Bms6nGr42NrKPGD2WMuJfFc3UJnOZ5BA8KRyM8qS9guz5qNlE-M9jhFCA',
		);
	});
});

describe('verifyJWT', () => {
	it('verifyJWT', async () => {
		const jwtTokenForAlice =
			'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJleGFtcGxlLmNvbSIsImV4cCI6MTU3NzgzNjgwMCwibSI6IkdFVCIsInVybCI6Ii91c2Vycz9pZD0xMjM0In0.zgSHXHKPw_ILGlfnjWpw6kcAbvxjZYFnVEfY4ztfxPkRRSquyOEjKHLhSqbrolxJR9h86Y5gkwOzhFbVuy9ACw';
		const verified = await verifyJWT(jwtTokenForAlice, AliceED25519PrivateKey.publicKey);

		expect(verified).toEqual(true);
	});
});
