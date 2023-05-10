import { decodeUtf8 } from '@mailchain/encoding';
import { hashMessage } from '@ethersproject/hash';
import {
	BobSECP256K1PublicKey,
	AliceSECP256K1PublicKey,
	AliceSECP256K1PrivateKeyBytes,
	BobSECP256K1PrivateKeyBytes,
	BobSECP256K1PrivateKey,
	AliceSECP256K1PrivateKey,
} from './test.const';
import { SECP256K1PrivateKey } from './';

describe('new()', () => {
	const tests = [
		{
			name: 'alice',
			arg: AliceSECP256K1PrivateKeyBytes,
			expected: {
				curve: 'secp256k1',
				bytes: AliceSECP256K1PrivateKeyBytes,
				publicKey: AliceSECP256K1PublicKey,
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			arg: BobSECP256K1PrivateKeyBytes,
			expected: {
				curve: 'secp256k1',
				bytes: BobSECP256K1PrivateKeyBytes,
				publicKey: BobSECP256K1PublicKey,
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
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				new SECP256K1PrivateKey(test.arg);
			}).toThrow();
		} else {
			expect(new SECP256K1PrivateKey(test.arg)).toEqual(test.expected!);
		}
	});
});

describe('sign()', () => {
	const tests = [
		{
			name: 'bob',
			privKey: BobSECP256K1PrivateKey,
			message: decodeUtf8('message'),
			expected: new Uint8Array([
				0x19, 0x32, 0x26, 0x3f, 0xda, 0x32, 0x74, 0x0a, 0xa9, 0x09, 0xd1, 0x85, 0x68, 0x1f, 0x82, 0xad, 0xb5,
				0xa8, 0x8e, 0xa8, 0xa4, 0x26, 0xc3, 0x59, 0x3a, 0x85, 0x74, 0x53, 0x93, 0x5b, 0x94, 0xe4, 0x34, 0xcc,
				0xcb, 0x6d, 0xff, 0x3a, 0xce, 0xe7, 0xa2, 0x92, 0x78, 0xd0, 0x82, 0xe5, 0x60, 0x70, 0x9f, 0xe2, 0xea,
				0x30, 0x2b, 0x3a, 0xc2, 0x02, 0xcb, 0x43, 0x89, 0x2b, 0x87, 0x9a, 0xe5, 0x55, 0x00,
			]),
			shouldThrow: false,
		},
		{
			name: 'alice',
			privKey: AliceSECP256K1PrivateKey,
			message: decodeUtf8('egassem'),
			expected: new Uint8Array([
				0xfb, 0xbc, 0xa9, 0xd5, 0x02, 0x5a, 0x03, 0x8e, 0xfc, 0xac, 0x1b, 0xe0, 0x4f, 0x0a, 0x96, 0x19, 0x6e,
				0x1f, 0x0e, 0x15, 0xd7, 0xf6, 0xb7, 0x17, 0xb0, 0xc3, 0x0a, 0xae, 0xbd, 0xef, 0x5b, 0x28, 0x3c, 0x6d,
				0x6b, 0x97, 0xbf, 0xf2, 0x87, 0x14, 0x86, 0x47, 0x41, 0x37, 0x06, 0x87, 0xc9, 0x55, 0x5a, 0x61, 0xc4,
				0xfe, 0xbc, 0xaf, 0x3d, 0xd9, 0x78, 0x98, 0xa1, 0x31, 0xe3, 0x78, 0x97, 0x85, 0x01,
			]),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const messageHash = Uint8Array.from(Buffer.from(hashMessage(test.message).replace('0x', ''), 'hex'));
		if (test.shouldThrow) {
			expect.assertions(1);
			return test.privKey.sign(messageHash).catch((e) => expect(e).toBeDefined());
		}
		return test.privKey.sign(messageHash).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('public-key', () => {
	const tests = [
		{
			name: 'bob',
			privKey: BobSECP256K1PrivateKey,
			expected: BobSECP256K1PublicKey,
		},
		{
			name: 'alice',
			privKey: AliceSECP256K1PrivateKey,
			expected: AliceSECP256K1PublicKey,
		},
	];
	tests.forEach((test) => {
		expect(test.privKey.publicKey).toEqual(test.expected);
	});
});

describe('generate', () => {
	const tests = [
		{
			name: '012345667890',
			rand: (): Uint8Array => {
				return new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]);
			},
			expected: new SECP256K1PrivateKey(
				new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]),
			),
			shouldThrow: false,
		},
		{
			name: 'err',
			rand: (): Uint8Array => {
				return new Uint8Array([0]);
			},
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				SECP256K1PrivateKey.generate(test.rand);
			}).toThrow();
		} else {
			expect(SECP256K1PrivateKey.generate(test.rand)).toEqual(test.expected!);
		}
	});
});
