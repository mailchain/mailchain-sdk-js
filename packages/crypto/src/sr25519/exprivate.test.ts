import { UnknownPrivateKey } from '../testing';
import { AliceSR25519PrivateKey, BobSR25519PrivateKey } from './test.const';
import { SR25519ExtendedPrivateKey, SR25519PrivateKey } from '.';

describe('FromPrivateKey()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceSR25519PrivateKey,
			expected: {
				Bytes: AliceSR25519PrivateKey.Bytes,
				PrivateKey: AliceSR25519PrivateKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobSR25519PrivateKey,
			expected: {
				Bytes: BobSR25519PrivateKey.Bytes,
				PrivateKey: BobSR25519PrivateKey,
			},
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new UnknownPrivateKey() as SR25519PrivateKey,
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					SR25519ExtendedPrivateKey.FromPrivateKey(test.arg);
				}).toThrow();
			} else {
				expect(SR25519ExtendedPrivateKey.FromPrivateKey(test.arg)).toEqual(test.expected);
			}
		});
	});
});
