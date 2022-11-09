import { UnknownPrivateKey } from '../testing';
import { AliceSR25519PrivateKey, BobSR25519PrivateKey } from './test.const';
import { SR25519ExtendedPrivateKey, SR25519PrivateKey } from '.';

describe('FromPrivateKey()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceSR25519PrivateKey,
			expected: {
				bytes: AliceSR25519PrivateKey.bytes,
				privateKey: AliceSR25519PrivateKey,
			} as SR25519ExtendedPrivateKey,
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobSR25519PrivateKey,
			expected: {
				bytes: BobSR25519PrivateKey.bytes,
				privateKey: BobSR25519PrivateKey,
			} as SR25519ExtendedPrivateKey,
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new UnknownPrivateKey() as SR25519PrivateKey,
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				SR25519ExtendedPrivateKey.fromPrivateKey(test.arg);
			}).toThrow();
		} else {
			expect(SR25519ExtendedPrivateKey.fromPrivateKey(test.arg)).toEqual(test.expected);
		}
	});
});
