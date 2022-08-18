import { toUtf8Bytes } from 'ethers/lib/utils';
import {
	AliceSR25519PublicKey,
	AliceSR25519KeyPair,
	AliceSR25519Seed,
	AliceSR25519SecretBytes,
	AliceSR25519PrivateKeyBytes,
	AliceSR25519PrivateKey,
	BobSR25519Seed,
	BobSR25519SecretBytes,
	BobSR25519PrivateKeyBytes,
	BobSR25519PrivateKey,
	BobSR25519PublicKey,
	BobSR25519KeyPair,
	EveSR25519Seed,
	EveSR25519SecretBytes,
	EveSR25519PrivateKeyBytes,
	EveSR25519KeyPair,
	EveSR25519PublicKey,
} from './test.const';
import { SR25519PrivateKey } from './';

describe('FromSeed()', () => {
	const tests = [
		{
			name: 'alice-seed',
			arg: AliceSR25519Seed,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: AliceSR25519PublicKey.bytes,
					secretKey: AliceSR25519SecretBytes,
				},
				bytes: AliceSR25519PrivateKeyBytes,
				publicKey: AliceSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'bob-seed',
			arg: BobSR25519Seed,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: BobSR25519PublicKey.bytes,
					secretKey: BobSR25519SecretBytes,
				},
				bytes: BobSR25519PrivateKeyBytes,
				publicKey: BobSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'eve-seed',
			arg: EveSR25519Seed,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: EveSR25519PublicKey.bytes,
					secretKey: EveSR25519SecretBytes,
				},
				bytes: EveSR25519PrivateKeyBytes,
				publicKey: EveSR25519PublicKey,
			} as SR25519PrivateKey,
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
			expect.assertions(1);
			return SR25519PrivateKey.fromSeed(test.arg).catch((e) => expect(e).toBeDefined());
		}
		return SR25519PrivateKey.fromSeed(test.arg).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('FromBytes()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceSR25519PrivateKeyBytes,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: AliceSR25519PublicKey.bytes,
					secretKey: AliceSR25519SecretBytes,
				},
				bytes: AliceSR25519PrivateKeyBytes,
				publicKey: AliceSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobSR25519PrivateKeyBytes,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: BobSR25519PublicKey.bytes,
					secretKey: BobSR25519SecretBytes,
				},
				bytes: BobSR25519PrivateKeyBytes,
				publicKey: BobSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'eve',
			arg: EveSR25519PrivateKeyBytes,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: EveSR25519PublicKey.bytes,
					secretKey: EveSR25519SecretBytes,
				},
				bytes: EveSR25519PrivateKeyBytes,
				publicKey: EveSR25519PublicKey,
			} as SR25519PrivateKey,
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
				SR25519PrivateKey.fromBytes(test.arg);
			}).toThrow();
		} else {
			expect(SR25519PrivateKey.fromBytes(test.arg)).toEqual(test.expected);
		}
	});
});

describe('FromKeyPair()', () => {
	const tests = [
		{
			name: 'alice-keypair',
			keypair: AliceSR25519KeyPair,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: AliceSR25519PublicKey.bytes,
					secretKey: AliceSR25519SecretBytes,
				},
				bytes: AliceSR25519PrivateKeyBytes,
				publicKey: AliceSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'bob-keypair',
			keypair: BobSR25519KeyPair,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: BobSR25519PublicKey.bytes,
					secretKey: BobSR25519SecretBytes,
				},
				bytes: BobSR25519PrivateKeyBytes,
				publicKey: BobSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'eve-keypair',
			keypair: EveSR25519KeyPair,
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: EveSR25519PublicKey.bytes,
					secretKey: EveSR25519SecretBytes,
				},
				bytes: EveSR25519PrivateKeyBytes,
				publicKey: EveSR25519PublicKey,
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'invalid',
			keypair: {
				publicKey: new Uint8Array([3, 189, 246]),
				secretKey: new Uint8Array([3, 1, 2]),
			},
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				SR25519PrivateKey.fromKeyPair(test.keypair);
			}).toThrow();
		} else {
			expect(SR25519PrivateKey.fromKeyPair(test.keypair)).toEqual(test.expected);
		}
	});
});

describe('sign()', () => {
	const tests = [
		{
			name: 'alice',
			privKey: AliceSR25519PrivateKey,
			message: toUtf8Bytes('egassem'),
			// expected: different each time
			shouldThrow: false,
		},
		{
			name: 'bob',
			privKey: BobSR25519PrivateKey,
			message: toUtf8Bytes('message'),
			// expected: different each time
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			return test.privKey.sign(test.message).catch((e) => expect(e).toBeDefined());
		}
		return test.privKey.sign(test.message).then((actual) => {
			expect(actual).toHaveLength(64);
		});
	});
});

describe('public-key', () => {
	const tests = [
		{
			name: 'alice',
			privKey: AliceSR25519PrivateKey,
			expected: AliceSR25519PublicKey,
		},
		{
			name: 'bob',
			privKey: BobSR25519PrivateKey,
			expected: BobSR25519PublicKey,
		},
	];
	test.each(tests)('$name', async (test) => {
		expect(test.privKey.publicKey).toEqual(test.expected);
	});
});

describe('generate', () => {
	const tests = [
		{
			name: 'generate',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([
					134, 222, 215, 10, 158, 142, 84, 118, 211, 113, 114, 16, 7, 32, 133, 180, 7, 209, 180, 246, 231, 54,
					240, 129, 195, 62, 61, 154, 18, 37, 116, 8,
				]);
			},
			expected: {
				curve: 'sr25519',
				keyPair: {
					publicKey: Uint8Array.from(
						Buffer.from('62117bbdbafbd9b5f3f66887d97d40eae39dc15c77de66a3ddffb26f5990bf7c', 'hex'),
					),
					secretKey: Uint8Array.from(
						Buffer.from(
							'f04a61b6cc521c964161ee688893c9c16ee4bb9f6fcb1f35a6b0300b2ff11d76d40a249b14efff20ff035b1cbd58e3366e6a604d99e39990bdb6b779df2329ab',
							'hex',
						),
					),
				},
				bytes: Uint8Array.from(
					Buffer.from(
						'f04a61b6cc521c964161ee688893c9c16ee4bb9f6fcb1f35a6b0300b2ff11d76d40a249b14efff20ff035b1cbd58e3366e6a604d99e39990bdb6b779df2329ab62117bbdbafbd9b5f3f66887d97d40eae39dc15c77de66a3ddffb26f5990bf7c',
						'hex',
					),
				),
				publicKey: {
					curve: 'sr25519',
					bytes: Uint8Array.from(
						Buffer.from('62117bbdbafbd9b5f3f66887d97d40eae39dc15c77de66a3ddffb26f5990bf7c', 'hex'),
					),
				},
			} as SR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'err',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([0]);
			},
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			return SR25519PrivateKey.generate(test.rand).catch((e) => expect(e).toBeDefined());
		}
		return SR25519PrivateKey.generate(test.rand).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
