import { decodeUtf8 } from '@mailchain/encoding';
import { blake2AsU8a } from '@polkadot/util-crypto/blake2';
import {
	BobSECP256R1PrivateKeyBytes,
	CarlosSECP256R1PrivateKeyBytes,
	AliceSECP256R1PrivateKeyBytes,
	CarolSECP256R1PrivateKeyBytes,
	BobSECP256R1PublicKeyBytes,
	CarlosSECP256R1PublicKeyBytes,
	AliceSECP256R1PublicKeyBytes,
	CarolSECP256R1PublicKeyBytes,
	BobSECP256R1PrivateKey,
	CarlosSECP256R1PrivateKey,
	AliceSECP256R1PrivateKey,
	CarolSECP256R1PrivateKey,
} from './test.const';
import { SECP256R1PrivateKey, SECP256R1PublicKey } from './';

function random(num?: number) {
	return new Uint8Array([
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
		30, 31,
	]);
}

describe('new()', () => {
	const tests = [
		{
			name: 'BobSECP256R1 new',
			arg: BobSECP256R1PrivateKeyBytes,
			expected: {
				curve: 'secp256r1',
				bytes: new Uint8Array([
					161, 230, 92, 70, 119, 67, 92, 234, 87, 149, 11, 57, 55, 154, 158, 199, 236, 12, 100, 237, 201, 126,
					254, 54, 205, 170, 227, 195, 134, 254, 43, 113,
				]),
				rand: random,
				publicKey: new SECP256R1PublicKey(
					new Uint8Array([
						3, 45, 164, 63, 75, 153, 41, 104, 229, 60, 104, 200, 148, 147, 62, 139, 162, 42, 121, 5, 191,
						156, 220, 144, 63, 217, 109, 79, 56, 255, 73, 225, 21,
					]),
				),
			},
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				new SECP256R1PrivateKey(test.arg, random);
			}).toThrow();
		} else {
			expect(new SECP256R1PrivateKey(test.arg, random)).toEqual(test.expected!);
		}
	});
});

describe('sign()', () => {
	const tests = [
		{
			name: 'BobSECP256R1 sign',
			privKey: BobSECP256R1PrivateKeyBytes,
			message: decodeUtf8('hello from mailchain'),
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]);
			},
			expected: Uint8Array.from(
				Buffer.from(
					'5d6cfcb93b7c3698341ef963205604f7b7ad0f9a6f52ea84c02ef494c27eaba54309e81f44f45907de0a7711994a17b8d21e69d2d2c3a040eac6e0e203fa7fad',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'CarlosSECP256R1 sign',
			privKey: CarlosSECP256R1PrivateKeyBytes,
			message: decodeUtf8('hello from mailchain'),
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]);
			},
			expected: Uint8Array.from(
				Buffer.from(
					'5dc9a3c61e34a77ce1ced6ef6114856eab46685824acbe3fdc5e0f502eb61ffb28d62a8cdc326374de6beb29da4d79f62f148af4d5f5fa24e81e82e812e05294',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'AliceSECP256R1 sign',
			privKey: AliceSECP256R1PrivateKeyBytes,
			message: decodeUtf8('hello from mailchain'),
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]);
			},
			expected: Uint8Array.from(
				Buffer.from(
					'164bcbb84304919a34d47683e4699a3dbb61f5ab6b3761c71437707e5fe062c27b166185d1d220ff825342c9f2ac4ef1ce7b710c0e58fbf815f136f9381d9610',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'CarolSECP256R1 sign',
			privKey: CarolSECP256R1PrivateKeyBytes,
			message: decodeUtf8('hello from mailchain'),
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]);
			},
			expected: Uint8Array.from(
				Buffer.from(
					'fd4706acf02006624442741d1e469dd674732a928b777c637f6fd4f930668b502883c3c20f26c1c38972aad3b3fe11a69eb48ab31d3aef70468f865e3bfad7dd',
					'hex',
				),
			),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const bytesHash = blake2AsU8a(test.message, 256);
		if (test.shouldThrow) {
			expect.assertions(1);
			return new SECP256R1PrivateKey(test.privKey, test.rand)
				.sign(bytesHash)
				.catch((e) => expect(e).toBeDefined());
		}
		return new SECP256R1PrivateKey(test.privKey, test.rand).sign(bytesHash).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('public-key', () => {
	const tests = [
		{
			name: 'BobSECP256R1 public key',
			privKey: BobSECP256R1PrivateKey,
			expected: BobSECP256R1PublicKeyBytes,
		},
		{
			name: 'CarlosSECP256R1 public key',
			privKey: CarlosSECP256R1PrivateKey,
			expected: CarlosSECP256R1PublicKeyBytes,
		},
		{
			name: 'AliceSECP256R1 public key',
			privKey: AliceSECP256R1PrivateKey,
			expected: AliceSECP256R1PublicKeyBytes,
		},
		{
			name: 'CarolSECP256R1 public key',
			privKey: CarolSECP256R1PrivateKey,
			expected: CarolSECP256R1PublicKeyBytes,
		},
	];
	test.each(tests)('$name', async (test) => {
		const got = test.privKey.publicKey.bytes;
		expect(got).toEqual(test.expected);
	});
});

describe('generate', () => {
	const tests = [
		{
			name: 'P256 012345667890',
			rand: random,
			expected: new SECP256R1PrivateKey(
				new Uint8Array([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
					27, 28, 29, 30, 31,
				]),
				random,
			),
			shouldThrow: false,
		},
		{
			name: 'err returned',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array([0]);
			},
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				SECP256R1PrivateKey.generate(test.rand);
			}).toThrow();
		} else {
			expect(SECP256R1PrivateKey.generate(test.rand)).toEqual(test.expected!);
		}
	});
});
