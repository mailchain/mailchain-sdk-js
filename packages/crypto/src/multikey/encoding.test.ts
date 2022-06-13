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
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKey.Bytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKey.Bytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PublicKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PublicKey.Bytes])),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					EncodePublicKey(test.arg);
				}).toThrow();
			} else {
				expect(EncodePublicKey(test.arg)).toEqual(test.expected);
			}
		});
	});
});

describe('DecodePublicKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PublicKey.Bytes])),
			expected: AliceSR25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PublicKey.Bytes])),
			expected: AliceED25519PublicKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PublicKey.Bytes])),
			expected: AliceSECP256K1PublicKey,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					DecodePublicKey(test.arg);
				}).toThrow();
			} else {
				expect(DecodePublicKey(test.arg)).toEqual(test.expected!);
			}
		});
	});
});

describe('EncodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: AliceSR25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKey.Bytes])),
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: AliceED25519PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKey.Bytes])),
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PrivateKey,
			expected: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKey.Bytes])),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					EncodePrivateKey(test.arg);
				}).toThrow();
			} else {
				expect(EncodePrivateKey(test.arg)).toEqual(test.expected);
			}
		});
	});
});

describe('DecodePrivateKey()', () => {
	const tests = [
		{
			name: 'sr25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSR25519]), AliceSR25519PrivateKey.Bytes])),
			expected: AliceSR25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'ed25519 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdED25519]), AliceED25519PrivateKey.Bytes])),
			expected: AliceED25519PrivateKey,
			shouldThrow: false,
		},
		{
			name: 'secp256k1 alice',
			arg: new Uint8Array(Buffer.concat([new Uint8Array([IdSECP256K1]), AliceSECP256K1PrivateKey.Bytes])),
			expected: AliceSECP256K1PrivateKey,
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					DecodePrivateKey(test.arg);
				}).toThrow();
			} else {
				const { Sign, ...expected } = test.expected!;

				expect(DecodePrivateKey(test.arg)).toEqual(expect.objectContaining(expected));
			}
		});
	});
});
