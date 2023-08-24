import { createTokenPayload } from './token';

describe('createTokenPayload', () => {
	const MS_IN_DATE = 1577836800;
	const exp = Math.floor(MS_IN_DATE * 0.001 + 60 * 5);

	afterAll(() => {
		jest.resetAllMocks();
		jest.clearAllTimers();
	});
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(MS_IN_DATE));
	});

	it('get', () => {
		const payload = createTokenPayload(new URL('https://example.com/users?id=1234'), 'GET', null, exp);
		expect(payload).toEqual({
			m: 'GET',
			url: '/users',
			q: 'id=1234',
			aud: 'example.com',
			exp,
		});
	});
	it('post-object', () => {
		const postBody = { scripts: { test: 'test value' } };
		const len = Buffer.byteLength(JSON.stringify(postBody));
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', postBody, exp);
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			len,
			bodyHash: 'lZj_Ob0n4u1BkdQB_qJ4wNsis_AIQg5oKedTtnhw4qE',
			aud: 'example.com',
			exp,
		});
	});
	it('post-arraybuffer', () => {
		const payload = createTokenPayload(
			new URL('https://example.com/users'),
			'POST',
			Uint8Array.from([1, 2]).buffer,
			exp,
		);
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			bodyHash: 'dui7BSFNHndsKkg29sGnRGyQonS5rnGcPGyKcn2GLBI',
			len: 2,
			aud: 'example.com',
			exp,
		});
	});
	it('post-uint8array', () => {
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', Uint8Array.from([1, 2]), exp);
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			bodyHash: 'dui7BSFNHndsKkg29sGnRGyQonS5rnGcPGyKcn2GLBI',
			len: 2,
			aud: 'example.com',
			exp,
		});
	});
	it('post-buffer', () => {
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', Buffer.from([1, 2]), exp);
		expect(payload).toEqual({
			m: 'POST',
			url: '/users',
			len: 2,
			aud: 'example.com',
			bodyHash: 'dui7BSFNHndsKkg29sGnRGyQonS5rnGcPGyKcn2GLBI',
			exp,
		});
	});
	it('post-string', () => {
		const payload = createTokenPayload(new URL('https://example.com/users'), 'POST', 'text', exp);
		expect(payload).toEqual({
			m: 'POST',
			bodyHash: 'mHtD29S5xxvcn2JiqA_d5eW24JWsrfur_kyvyPNLQZo',
			url: '/users',
			len: 4,
			aud: 'example.com',
			exp,
		});
	});
});
