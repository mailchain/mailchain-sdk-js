import {
	BobED25519PublicKey,
	AliceED25519PublicKey,
	BobED25519PrivateKey,
	AliceED25519PrivateKey,
} from '@mailchain/crypto/ed25519/test.const';
import { ED25519KeyExchange } from './';

describe('shared-secret', () => {
	const tests = [
		{
			name: 'success-bob-alice',
			prvKey: BobED25519PrivateKey,
			pubKey: AliceED25519PublicKey,
			expected: new Uint8Array([
				0xf1, 0x48, 0xbc, 0xc6, 0xb7, 0x3d, 0x8c, 0xb3, 0xdd, 0x85, 0x8e, 0x26, 0xb1, 0x47, 0x78, 0xfa, 0x9b,
				0xfa, 0xc8, 0xc3, 0xdd, 0xd5, 0xdd, 0x9f, 0xe7, 0x1e, 0x26, 0x66, 0xd6, 0x1c, 0xf0, 0x4d,
			]),
			shouldThrow: false,
		},
		{
			name: 'success-alice-bob',
			prvKey: AliceED25519PrivateKey,
			pubKey: BobED25519PublicKey,
			expected: new Uint8Array([
				0xf1, 0x48, 0xbc, 0xc6, 0xb7, 0x3d, 0x8c, 0xb3, 0xdd, 0x85, 0x8e, 0x26, 0xb1, 0x47, 0x78, 0xfa, 0x9b,
				0xfa, 0xc8, 0xc3, 0xdd, 0xd5, 0xdd, 0x9f, 0xe7, 0x1e, 0x26, 0x66, 0xd6, 0x1c, 0xf0, 0x4d,
			]),
			shouldThrow: false,
		},
		{
			name: 'err-alice-alice',
			prvKey: AliceED25519PrivateKey,
			pubKey: AliceED25519PublicKey,
			expected: null,
			shouldThrow: true,
		},
		{
			name: 'err-bob-bob',
			prvKey: BobED25519PrivateKey,
			pubKey: BobED25519PublicKey,
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = new ED25519KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.SharedSecret(test.prvKey, test.pubKey).catch((e) => expect(e).toBeDefined());
		}
		return target.SharedSecret(test.prvKey, test.pubKey).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('publicKeyToCurve25519', () => {
	const tests = [
		{
			name: 'alice',
			prvKey: AliceED25519PublicKey,
			expected: new Uint8Array([
				0x22, 0xc9, 0x82, 0x7, 0x9b, 0x62, 0x1a, 0xc6, 0xfd, 0xba, 0x20, 0x73, 0x71, 0x60, 0xcc, 0x91, 0xb3,
				0x8f, 0x75, 0x71, 0x69, 0xfd, 0xfb, 0x97, 0xfe, 0xe7, 0x37, 0xe3, 0x7c, 0x69, 0x19, 0x5b,
			]),
			shouldThrow: false,
		},
		{
			name: 'bob',
			prvKey: BobED25519PublicKey,
			expected: new Uint8Array([
				0x9c, 0x19, 0x11, 0x65, 0xc0, 0x42, 0x98, 0x6c, 0x26, 0x5f, 0x3d, 0x62, 0x94, 0x3, 0x2a, 0x7a, 0xe,
				0x97, 0x64, 0x7a, 0x1a, 0x1b, 0xde, 0x1d, 0x4d, 0xec, 0x7, 0x9, 0xd6, 0x62, 0x2a, 0x41,
			]),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				ED25519KeyExchange.publicKeyToCurve25519(test.prvKey);
			}).toThrow();
		} else {
			expect(ED25519KeyExchange.publicKeyToCurve25519(test.prvKey)).toEqual(test.expected);
		}
	});
});

describe('privateKeyToCurve25519', () => {
	const tests = [
		{
			name: 'alice',
			prvKey: AliceED25519PrivateKey,
			expected: new Uint8Array([
				0x58, 0x9e, 0xe, 0x2a, 0x34, 0x4, 0x8f, 0xb7, 0xa2, 0x3a, 0xe1, 0xa, 0xcb, 0xe0, 0xd3, 0x2b, 0x9b, 0x7f,
				0xf7, 0x44, 0x25, 0xc4, 0x80, 0xa8, 0xf7, 0xc2, 0xeb, 0xea, 0xf0, 0xff, 0x77, 0x76,
			]),
			shouldThrow: false,
		},
		{
			name: 'bob',
			prvKey: BobED25519PrivateKey,
			expected: new Uint8Array([
				0xd8, 0x9, 0x35, 0xbd, 0xce, 0x18, 0xc1, 0x87, 0x54, 0xbe, 0x74, 0x84, 0xf5, 0xbf, 0xa6, 0x1d, 0x87,
				0x60, 0xfd, 0xb4, 0x3a, 0x9d, 0x98, 0x86, 0x50, 0x28, 0x22, 0x21, 0x8a, 0xe, 0xc6, 0x6b,
			]),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				ED25519KeyExchange.privateKeyToCurve25519(test.prvKey);
			}).toThrow();
		} else {
			expect(ED25519KeyExchange.privateKeyToCurve25519(test.prvKey)).toEqual(test.expected);
		}
	});
});
