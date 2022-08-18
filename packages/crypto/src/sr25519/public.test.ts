import {
	AliceSR25519PublicKeyBytes,
	AliceSR25519PublicKey,
	BobSR25519PublicKeyBytes,
	BobSR25519PublicKey,
	EveSR25519PublicKeyBytes,
} from './test.const';
import { SR25519PublicKey } from './';

describe('new()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceSR25519PublicKeyBytes,
			expected: {
				curve: 'sr25519',
				bytes: AliceSR25519PublicKeyBytes,
			} as SR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobSR25519PublicKeyBytes,
			expected: {
				curve: 'sr25519',
				bytes: BobSR25519PublicKeyBytes,
			} as SR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'eve',
			arg: EveSR25519PublicKeyBytes,
			expected: {
				curve: 'sr25519',
				bytes: EveSR25519PublicKeyBytes,
			} as SR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new Uint8Array([3, 189, 246]),
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				new SR25519PublicKey(test.arg);
			}).toThrow();
		} else {
			expect(new SR25519PublicKey(test.arg)).toEqual(test.expected);
		}
	});
});

describe('verify()', () => {
	const tests = [
		{
			name: 'alice',
			pubKey: AliceSR25519PublicKey,
			message: new Uint8Array(Buffer.from('egassem', 'ascii')),
			sig: Uint8Array.from(
				Buffer.from(
					'e647e6daf24aeceb7147fca1b370522045167399f6bfcc208b3a6a0d2e046f17ce2bf3d9c5220afb82546023e258c680909318f604be29c1219b7d0371b9188b',
					'hex',
				),
			),
			expected: true,
			shouldThrow: false,
		},
		{
			name: 'bob',
			pubKey: BobSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			sig: Uint8Array.from(
				Buffer.from(
					'96457c205f97a0f9854c8468d9c9c7dfbe44a5b86d5aca779e1bb0ffde91360e3fec2a5722ea65673c38b100173dc58bf57462bd8c319830601c39395a43ba8c',
					'hex',
				),
			),
			expected: true,
			shouldThrow: false,
		},
		{
			name: 'err-invalid-signature-alice',
			pubKey: AliceSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			sig: Uint8Array.from(
				Buffer.from(
					'96457c205f97a0f9854c8468d9c9c7dfbe44a5b86d5aca779e1bb0ffde91360e3fec2a5722ea65673c38b100173dc58bf57462bd8c319830601c39395a43ba8c',
					'hex',
				),
			),
			expected: false,
			shouldThrow: false,
		},
		{
			name: 'err-invalid-signature-bob',
			pubKey: BobSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			sig: Uint8Array.from(
				Buffer.from(
					'e647e6daf24aeceb7147fca1b370522045167399f6bfcc208b3a6a0d2e046f17ce2bf3d9c5220afb82546023e258c680909318f604be29c1219b7d0371b9188b',
					'hex',
				),
			),
			expected: false,
			shouldThrow: false,
		},
		{
			name: 'err-invalid-signature',
			pubKey: AliceSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			sig: new Uint8Array([0xd]),
			expected: false,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			return test.pubKey.verify(test.message, test.sig).catch((e) => expect(e).toBeDefined());
		}
		return test.pubKey.verify(test.message, test.sig).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
