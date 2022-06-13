import { toUtf8Bytes } from 'ethers/lib/utils';
import { DecodeHex } from '@mailchain/encoding';
import {
	AliceED25519Seed,
	AliceED25519PrivateKeyBytes,
	AliceED25519PrivateKey,
	BobED25519Seed,
	BobED25519PrivateKeyBytes,
	BobED25519PrivateKey,
	BobED25519PublicKey,
	AliceED25519PublicKey,
} from './test.const';
import { ED25519PrivateKey } from './';

describe('fromSeed()', () => {
	const tests = [
		{
			name: 'alice-seed',
			arg: AliceED25519Seed,
			expected: {
				KeyPair: {
					publicKey: AliceED25519PublicKey.Bytes,
					secretKey: AliceED25519PrivateKeyBytes,
				},
				Bytes: AliceED25519PrivateKeyBytes,
				PublicKey: AliceED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob-seed',
			arg: BobED25519Seed,
			expected: {
				KeyPair: {
					publicKey: BobED25519PublicKey.Bytes,
					secretKey: BobED25519PrivateKeyBytes,
				},
				Bytes: BobED25519PrivateKeyBytes,
				PublicKey: BobED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new Uint8Array([3, 189, 246]),
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					ED25519PrivateKey.FromSeed(test.arg);
				}).toThrow();
			} else {
				const { ...expected } = test.expected!;

				expect(ED25519PrivateKey.FromSeed(test.arg)).toEqual(expect.objectContaining(expected));
			}
		});
	});
});

describe('fromSeed()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceED25519PrivateKeyBytes,
			expected: {
				KeyPair: {
					publicKey: AliceED25519PublicKey.Bytes,
					secretKey: AliceED25519PrivateKeyBytes,
				},
				Bytes: AliceED25519PrivateKeyBytes,
				PublicKey: AliceED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobED25519PrivateKeyBytes,
			expected: {
				KeyPair: {
					publicKey: BobED25519PublicKey.Bytes,
					secretKey: BobED25519PrivateKeyBytes,
				},
				Bytes: BobED25519PrivateKeyBytes,
				PublicKey: BobED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: new Uint8Array([3, 189, 246]),
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					ED25519PrivateKey.FromSecretKey(test.arg);
				}).toThrow();
			} else {
				const { ...expected } = test.expected!;

				expect(ED25519PrivateKey.FromSecretKey(test.arg)).toEqual(expect.objectContaining(expected));
			}
		});
	});
});

describe('new()', () => {
	const tests = [
		{
			name: 'alice',
			arg: {
				publicKey: AliceED25519PublicKey.Bytes,
				secretKey: AliceED25519PrivateKeyBytes,
			},
			expected: {
				KeyPair: {
					publicKey: AliceED25519PublicKey.Bytes,
					secretKey: AliceED25519PrivateKeyBytes,
				},
				Bytes: AliceED25519PrivateKeyBytes,
				PublicKey: AliceED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: {
				publicKey: BobED25519PublicKey.Bytes,
				secretKey: BobED25519PrivateKeyBytes,
			},
			expected: {
				KeyPair: {
					publicKey: BobED25519PublicKey.Bytes,
					secretKey: BobED25519PrivateKeyBytes,
				},
				Bytes: BobED25519PrivateKeyBytes,
				PublicKey: BobED25519PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: {
				secretKey: new Uint8Array([3, 189, 246]),
				publicKey: new Uint8Array([3, 189, 246]),
			},
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					new ED25519PrivateKey(test.arg);
				}).toThrow();
			} else {
				const { ...expected } = test.expected!;
				expect(new ED25519PrivateKey(test.arg)).toEqual(expect.objectContaining(expected));
			}
		});
	});
});

describe('sign()', () => {
	const tests = [
		{
			name: 'alice',
			privKey: AliceED25519PrivateKey,
			message: toUtf8Bytes('egassem'),
			expected: new Uint8Array([
				0xde, 0x6c, 0x88, 0xe6, 0x9c, 0x9f, 0x93, 0xb, 0x59, 0xdd, 0xf4, 0x80, 0xc2, 0x9a, 0x55, 0x79, 0xec,
				0x89, 0x5c, 0xa9, 0x7a, 0x36, 0xf6, 0x69, 0x74, 0xc1, 0xf0, 0x15, 0x5c, 0xc0, 0x66, 0x75, 0x2e, 0xcd,
				0x9a, 0x9b, 0x41, 0x35, 0xd2, 0x72, 0x32, 0xe0, 0x54, 0x80, 0xbc, 0x98, 0x58, 0x1, 0xa9, 0xfd, 0xe4,
				0x27, 0xc7, 0xef, 0xa5, 0x42, 0x5f, 0xf, 0x46, 0x49, 0xb8, 0xad, 0xbd, 0x5,
			]),
			shouldThrow: false,
		},
		{
			name: 'bob',
			privKey: BobED25519PrivateKey,
			message: toUtf8Bytes('message'),
			expected: new Uint8Array([
				0x7d, 0x51, 0xea, 0xfa, 0x52, 0x78, 0x31, 0x69, 0xd0, 0xa9, 0x4a, 0xc, 0x9f, 0x2b, 0xca, 0xd5, 0xe0,
				0x3d, 0x29, 0x17, 0x33, 0x0, 0x93, 0xf, 0xf3, 0xc7, 0xd6, 0x3b, 0xfd, 0x64, 0x17, 0xae, 0x1b, 0xc8,
				0x1f, 0xef, 0x51, 0xba, 0x14, 0x9a, 0xe8, 0xa1, 0xe1, 0xda, 0xe0, 0x5f, 0xdc, 0xa5, 0x7, 0x8b, 0x14,
				0xba, 0xc4, 0xcf, 0x26, 0xcc, 0xc6, 0x1, 0x1e, 0x5e, 0xab, 0x77, 0x3, 0xc,
			]),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect.assertions(1);
				return test.privKey.Sign(test.message).catch((e) => expect(e).toBeDefined());
			}
			return test.privKey.Sign(test.message).then((actual) => {
				expect(actual).toEqual(test.expected);
			});
		});
	});
});

describe('public-key', () => {
	const tests = [
		{
			name: 'alice',
			privKey: AliceED25519PrivateKey,
			expected: AliceED25519PublicKey,
		},
		{
			name: 'bob',
			privKey: BobED25519PrivateKey,
			expected: BobED25519PublicKey,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const { ...expected } = test.expected!;
			expect(test.privKey.PublicKey).toEqual(expect.objectContaining(expected));
		});
	});
});

describe('generate', () => {
	const tests = [
		{
			name: 'generates a key from rand',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(
					DecodeHex(
						'86ded70a9e8e5476d3717210072085b407d1b4f6e736f081c33e3d9a1225740824c19fbb25d3988393c2452db72e8c28fa5405277119762f7fe1cdcdfa0bdfc4',
					).slice(0, num),
				);
			},
			expected: new ED25519PrivateKey({
				publicKey: DecodeHex('24c19fbb25d3988393c2452db72e8c28fa5405277119762f7fe1cdcdfa0bdfc4'),
				secretKey: DecodeHex(
					'86ded70a9e8e5476d3717210072085b407d1b4f6e736f081c33e3d9a1225740824c19fbb25d3988393c2452db72e8c28fa5405277119762f7fe1cdcdfa0bdfc4',
				),
			}),
			shouldThrow: false,
		},
		{
			name: 'errors with invalid rando',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([0]);
			},
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					ED25519PrivateKey.Generate(test.rand);
				}).toThrow();
			} else {
				const actual = ED25519PrivateKey.Generate(test.rand);
				const { Sign, ...expected } = test.expected!;
				expect(actual).toEqual(expect.objectContaining(expected));
			}
		});
	});
});
