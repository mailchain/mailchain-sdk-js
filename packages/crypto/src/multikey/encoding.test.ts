import { AliceSECP256K1PublicKey, AliceSECP256K1PrivateKey } from '../secp256k1/test.const';
import { AliceSR25519PublicKey, AliceSR25519PrivateKey } from '../sr25519/test.const';
import { AliceED25519PublicKey, AliceED25519PrivateKey } from '../ed25519/test.const';
import { IdED25519, IdSR25519 } from '../keys';
import { IdSECP256K1 } from '..';
import { DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey } from './encoding';

describe('EncodePublicKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: AliceSR25519PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKey.bytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKey.bytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PublicKey.bytes])),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				EncodePublicKey(test.arg);
			}).toThrow();
		} else {
			expect(EncodePublicKey(test.arg)).toEqual(test.expected);
		}
	});
});

describe('DecodePublicKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKey.bytes])),
			expected: AliceSR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKey.bytes])),
			expected: AliceED25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PublicKey.bytes])),
			expected: AliceSECP256K1PublicKey,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				DecodePublicKey(test.arg);
			}).toThrow();
		} else {
			expect(DecodePublicKey(test.arg)).toEqual(test.expected!);
		}
	});
});

describe('EncodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: AliceSR25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKey.bytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKey.bytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKey.bytes])),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				EncodePrivateKey(test.arg);
			}).toThrow();
		} else {
			expect(EncodePrivateKey(test.arg)).toEqual(test.expected);
		}
	});
});

describe('DecodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKey.bytes])),
			expected: AliceSR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKey.bytes])),
			expected: AliceED25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKey.bytes])),
			expected: AliceSECP256K1PrivateKey,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				DecodePrivateKey(test.arg);
			}).toThrow();
		} else {
			const { sign, ...expected } = test.expected!;

			expect(DecodePrivateKey(test.arg)).toEqual(expect.objectContaining(expected));
		}
	});
});
