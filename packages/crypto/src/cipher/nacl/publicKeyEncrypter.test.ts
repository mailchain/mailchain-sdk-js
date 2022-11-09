import { AliceED25519PublicKey, BobED25519PublicKey } from '../../ed25519/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '../../secp256k1/test.const';
import { AliceSR25519PublicKey, BobSR25519PublicKey } from '../../sr25519/test.const';
import { SR25519KeyExchange } from '../ecdh/sr25519';
import { SECP256K1KeyExchange } from '../ecdh/secp256k1';
import { ED25519KeyExchange } from '../ecdh/ed25519';
import { ED25519PrivateKey } from '../../ed25519';
import { PrivateKey } from '../..';
import { PublicKeyEncrypter } from '.';

describe('Encrypt', () => {
	const tests = [
		{
			name: 'secp256k1-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): SECP256K1KeyExchange => {
				return new SECP256K1KeyExchange((num?: number): Uint8Array => {
					return new Uint8Array([
						73, 74, 75, 76, 77, 78, 79, 80, 164, 64, 33, 163, 205, 32, 214, 3, 184, 63, 147, 102, 195, 145,
						14, 207, 153, 72, 0, 132, 152, 113, 51, 79,
					]).slice(0, num);
				});
			},
			pubKey: AliceSECP256K1PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: new Uint8Array([
				0x2a, 0xe1, 0x2, 0xa7, 0xc3, 0xc4, 0xf5, 0x83, 0x73, 0xc0, 0xf6, 0x30, 0xc8, 0x62, 0x63, 0xf, 0x6d,
				0x8a, 0xbd, 0xe1, 0x39, 0x48, 0x30, 0xb9, 0xa4, 0x98, 0x8a, 0x3d, 0x6e, 0xe8, 0x86, 0x8b, 0x7a, 0x45,
				0xf7, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50,
				0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x4c, 0xc6, 0xb4, 0xfe, 0x90, 0xda, 0x5e, 0xc7, 0x42,
				0x23, 0x12, 0x5f, 0x6c, 0xb3, 0xf5, 0x15, 0x70, 0xed, 0xa7, 0x78, 0x8b, 0xf, 0x3d,
			]),
			shouldThrow: false,
		},
		{
			name: 'secp256k1-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): SECP256K1KeyExchange => {
				return new SECP256K1KeyExchange((num?: number): Uint8Array => {
					return new Uint8Array([
						73, 74, 75, 76, 77, 78, 79, 80, 164, 64, 33, 163, 205, 32, 214, 3, 184, 63, 147, 102, 195, 145,
						14, 207, 153, 72, 0, 132, 152, 113, 51, 79,
					]).slice(0, num);
				});
			},
			pubKey: BobSECP256K1PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: new Uint8Array([
				0x2a, 0xe1, 0x2, 0xa7, 0xc3, 0xc4, 0xf5, 0x83, 0x73, 0xc0, 0xf6, 0x30, 0xc8, 0x62, 0x63, 0xf, 0x6d,
				0x8a, 0xbd, 0xe1, 0x39, 0x48, 0x30, 0xb9, 0xa4, 0x98, 0x8a, 0x3d, 0x6e, 0xe8, 0x86, 0x8b, 0x7a, 0x45,
				0xf7, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50,
				0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0xdc, 0xcc, 0x41, 0xa1, 0x3a, 0xa5, 0x54, 0xb7, 0x6b,
				0xa3, 0x76, 0x72, 0x21, 0x7d, 0xca, 0xe4, 0xea, 0x43, 0xea, 0xc2, 0x57, 0x83, 0xa9,
			]),
			shouldThrow: false,
		},
		{
			name: 'ed25519-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): ED25519KeyExchange => {
				const ex = new ED25519KeyExchange();
				ex.EphemeralKey = async (): Promise<PrivateKey> => {
					return ED25519PrivateKey.fromSeed(
						Uint8Array.from(
							Buffer.from('4142434445464748494a4b4c4d4e4f505152535455565758595a414243444546', 'hex'),
						),
					);
				};
				return ex;
			},
			pubKey: AliceED25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: new Uint8Array([
				0x2a, 0xe2, 0x80, 0x56, 0xec, 0xbf, 0x3c, 0xc5, 0xac, 0xd1, 0x60, 0xdd, 0xf0, 0x22, 0x97, 0xbb, 0xba,
				0xa1, 0x55, 0x5b, 0xde, 0xa0, 0x4, 0xc2, 0x9b, 0xa9, 0x96, 0x48, 0x89, 0xe1, 0xdc, 0xcd, 0x1, 0x5b,
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x77, 0x66, 0x5d, 0x95, 0x6d, 0x2f, 0x8e, 0x7, 0x7e, 0x90,
				0x7, 0xa4, 0xa1, 0xff, 0x59, 0x9c, 0xbf, 0xf9, 0x38, 0x16, 0xd6, 0x8e, 0xed,
			]),
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): ED25519KeyExchange => {
				const ex = new ED25519KeyExchange();
				ex.EphemeralKey = async (): Promise<PrivateKey> => {
					return ED25519PrivateKey.fromSeed(
						Uint8Array.from(
							Buffer.from('4142434445464748494a4b4c4d4e4f505152535455565758595a414243444546', 'hex'),
						),
					);
				};
				return ex;
			},
			pubKey: BobED25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: new Uint8Array([
				0x2a, 0xe2, 0x80, 0x56, 0xec, 0xbf, 0x3c, 0xc5, 0xac, 0xd1, 0x60, 0xdd, 0xf0, 0x22, 0x97, 0xbb, 0xba,
				0xa1, 0x55, 0x5b, 0xde, 0xa0, 0x4, 0xc2, 0x9b, 0xa9, 0x96, 0x48, 0x89, 0xe1, 0xdc, 0xcd, 0x1, 0x5b,
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0xc2, 0x45, 0x87, 0x8, 0x51, 0xe3, 0x9b, 0xff, 0x31, 0x8,
				0x9f, 0x40, 0xb6, 0x99, 0x57, 0x99, 0xef, 0x20, 0xba, 0x8e, 0x3b, 0xfd, 0xd1,
			]),
			shouldThrow: false,
		},

		{
			name: 'sr25519-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): SR25519KeyExchange => {
				return new SR25519KeyExchange((num?: number): Uint8Array => {
					return new Uint8Array([
						73, 74, 75, 76, 77, 78, 79, 80, 164, 64, 33, 163, 205, 32, 214, 3, 184, 63, 147, 102, 195, 145,
						14, 207, 153, 72, 0, 132, 152, 113, 51, 79,
					]).slice(0, num);
				});
			},
			pubKey: AliceSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2ae368afbb2795d629ea99e075cb4829ef98aaeafc6087b0a1f065ca1ab23e36425c4142434445464748494a4b4c4d4e4f5051525354555657581f0eabeba03feeed30b9e1df26e4b66df0d23d34f5ddb3',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'sr25519-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			keyExFunc: (): SR25519KeyExchange => {
				return new SR25519KeyExchange((num?: number): Uint8Array => {
					return new Uint8Array([
						73, 74, 75, 76, 77, 78, 79, 80, 164, 64, 33, 163, 205, 32, 214, 3, 184, 63, 147, 102, 195, 145,
						14, 207, 153, 72, 0, 132, 152, 113, 51, 79,
					]).slice(0, num);
				});
			},
			pubKey: BobSR25519PublicKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2ae368afbb2795d629ea99e075cb4829ef98aaeafc6087b0a1f065ca1ab23e36425c4142434445464748494a4b4c4d4e4f505152535455565758683bc9bbab763bddf8591aff091dbc998c1fe6dea4ae90',
					'hex',
				),
			),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = new PublicKeyEncrypter(test.keyExFunc(), test.pubKey, test.rand);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.encrypt(test.message).catch((e) => expect(e).toBeDefined());
		}
		return target.encrypt(test.message).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
