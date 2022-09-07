import {
	AliceSECP256K1PublicKey,
	AliceSECP256K1PrivateKey,
	AliceSECP256K1PrivateKeyBytes,
	AliceCompressedSECP256K1PublicKeyBytes,
	AliceUncompressedSECP256K1PublicKeyBytes,
} from '../secp256k1/test.const';
import {
	AliceSR25519PublicKey,
	AliceSR25519PrivateKey,
	AliceSR25519PrivateKeyBytes,
	AliceSR25519PublicKeyBytes,
} from '../sr25519/test.const';
import {
	AliceED25519PublicKey,
	AliceED25519PrivateKey,
	AliceED25519PrivateKeyBytes,
	AliceED25519PublicKeyBytes,
} from '../ed25519/test.const';
import { IdED25519, IdSR25519, IdSECP256K1 } from '../keys';
import { decodePrivateKey, decodePublicKey, encodePrivateKey, encodePublicKey } from './encoding';

describe('EncodePublicKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: AliceSR25519PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKeyBytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKeyBytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PublicKey,
			expected: new Uint8Array(
				Buffer.concat([new Uint8Array([IdSECP256K1]), AliceCompressedSECP256K1PublicKeyBytes]),
			),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				encodePublicKey(test.arg);
			}).toThrow();
		} else {
			expect(encodePublicKey(test.arg)).toEqual(test.expected);
		}
	});
});

describe('DecodePublicKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKeyBytes])),
			expected: AliceSR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKeyBytes])),
			expected: AliceED25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice compressed',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceCompressedSECP256K1PublicKeyBytes])),
			expected: AliceSECP256K1PublicKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice uncompressed',
			arg: new Uint8Array(
				Buffer.concat([new Uint8Array([IdSECP256K1]), AliceUncompressedSECP256K1PublicKeyBytes]),
			),
			expected: AliceSECP256K1PublicKey,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				decodePublicKey(test.arg);
			}).toThrow();
		} else {
			expect(decodePublicKey(test.arg)).toEqual(test.expected!);
		}
	});
});

describe('EncodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: AliceSR25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKeyBytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKeyBytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKeyBytes])),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				encodePrivateKey(test.arg);
			}).toThrow();
		} else {
			expect(encodePrivateKey(test.arg)).toEqual(test.expected);
		}
	});
});

describe('DecodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKeyBytes])),
			expected: AliceSR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKeyBytes])),
			expected: AliceED25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice via full private key',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKeyBytes])),
			expected: AliceED25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKeyBytes])),
			expected: AliceSECP256K1PrivateKey,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				decodePrivateKey(test.arg);
			}).toThrow();
		} else {
			const { sign, ...expected } = test.expected!;

			expect(decodePrivateKey(test.arg)).toEqual(expected);
		}
	});
});
