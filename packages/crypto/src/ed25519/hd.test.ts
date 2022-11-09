import { UnknownPrivateKey } from '../testing';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from './test.const';
import { ED25519ExtendedPrivateKey } from '.';

describe('FromPrivateKey()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceED25519PrivateKey,
			expected: {
				bytes: AliceED25519PrivateKey.bytes,
				privateKey: AliceED25519PrivateKey,
			} as ED25519ExtendedPrivateKey,
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobED25519PrivateKey,
			expected: {
				bytes: BobED25519PrivateKey.bytes,
				privateKey: BobED25519PrivateKey,
			} as ED25519ExtendedPrivateKey,
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new UnknownPrivateKey(),
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				ED25519ExtendedPrivateKey.fromPrivateKey(test.arg);
			}).toThrow();
		} else {
			expect(ED25519ExtendedPrivateKey.fromPrivateKey(test.arg)).toEqual(test.expected);
		}
	});
});
