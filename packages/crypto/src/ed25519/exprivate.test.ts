import { UnknownPrivateKey } from '../testing';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from './test.const';
import { ED25519ExtendedPrivateKey } from '.';

describe('FromPrivateKey()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceED25519PrivateKey,
			expected: {
				Bytes: AliceED25519PrivateKey.Bytes,
				PrivateKey: AliceED25519PrivateKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobED25519PrivateKey,
			expected: {
				Bytes: BobED25519PrivateKey.Bytes,
				PrivateKey: BobED25519PrivateKey,
			},
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new UnknownPrivateKey(),
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					ED25519ExtendedPrivateKey.FromPrivateKey(test.arg);
				}).toThrow();
			} else {
				expect(ED25519ExtendedPrivateKey.FromPrivateKey(test.arg)).toEqual(test.expected);
			}
		});
	});
});
