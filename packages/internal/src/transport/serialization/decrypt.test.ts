import { KindNaClSecretKey } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519/hd';
import { AliceED25519PrivateKey, AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { PayloadHeaders, SerializableTransportPayloadHeaders } from '../payload/headers';
import { decryptBuffer, decryptChunks, decryptPayload } from './decrypt';
import { EncryptedPayload } from './payload';

describe('decryptBuffer', () => {
	const tests = [
		{
			name: 'data',
			input: Buffer.from(
				'2be24142434445464748494a4b4c4d4e4f5051525354555657580ca79c555d33ef99bcd8993ee5a99a8b3ac12abc8256e5d1a28d12',
				'hex',
			),
			privateKey: AliceED25519PrivateKey,
			expected: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, async () => {
			const target = decryptBuffer;
			if (test.shouldThrow) {
				expect.assertions(1);
				try {
					target(test.input, test.privateKey);
				} catch (e) {
					expect(e).toBeDefined();
				}
			} else {
				return target(test.input, test.privateKey).then((actual) => {
					expect(actual).toEqual(test.expected);
				});
			}
		});
	});
});

describe('encryptChunks', () => {
	const tests = [
		{
			name: 'data',
			chunks: [
				Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f505152535455565758071fd359f22223df30474a8f313fda0955505e65',
					'hex',
				),
				Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f505152535455565758c1d97a55aeae25b402b8741caece15851eabaf0a',
					'hex',
				),
				Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f50515253545556575863e984dd69c2ff7f4ee9634c7a5591f7e03dea',
					'hex',
				),
			],
			privateKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
			expected: [Buffer.from([0, 1, 2, 3]), Buffer.from([4, 5, 6, 7]), Buffer.from([8, 9, 10])],
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, async () => {
			const target = decryptChunks;
			if (test.shouldThrow) {
				expect.assertions(1);
				try {
					target(test.chunks, test.privateKey);
				} catch (e) {
					expect(e).toBeDefined();
				}
			} else {
				return target(test.chunks, test.privateKey).then((actual) => {
					expect(actual).toEqual(test.expected);
				});
			}
		});
	});
});

describe('decryptPayload', () => {
	const tests = [
		{
			name: 'data',
			input: {
				EncryptedContentChunks: [
					Buffer.from(
						'2be24142434445464748494a4b4c4d4e4f505152535455565758dd1e96e4f2acd9b69c7e8cf96e88bbdc55505e',
						'hex',
					),
					Buffer.from(
						'2be24142434445464748494a4b4c4d4e4f50515253545556575875efd0c14d939d377acc0a831feb0db119aaac',
						'hex',
					),
					Buffer.from(
						'2be24142434445464748494a4b4c4d4e4f505152535455565758958428b3b391d2ef8f2399c2ac4032deee33e8',
						'hex',
					),
					Buffer.from(
						'2be24142434445464748494a4b4c4d4e4f5051525354555657588153aae306bb436f3b542ebea58b68098124',
						'hex',
					),
				],
				EncryptedHeaders: Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f505152535455565758c3d4293f76760d680066807cbb36aad47f31a3a9815196437c9722bb1d427913a76b6045a4999c8134ce5734a0cec7e49b67b71727c954f8de15d0c6567df5cfc770c5a1beb8a301238cd9f5aed5ab2d28989847fd94f9acdc8b844e698ff10ea66c293979dbef7a3cfe609cbe7cd17c355be0288c6dd3fabe1cdce335d897123240b37a8300c5092957b4a0c6ea993c55ce2ddab58e567927aacca2c78be15611dc92946fdb7062ecc2e533b7bfad10781ab228dc9cf186d8ddd24dd1b8c13b90e0fec990c84bb78110b610575e72e422aa4d5716eb57a03da4a5ca8ae252235667993f38cdbc66ed212f36ada9059d98abeef570a18f5c4cede7b4a44cb0beee9ab3d1aafbbed3e2ede13173a870c8c4a08afac6e1a934d99e402a2ab98f5f69e434e3a49e3a589278',
					'hex',
				),
			} as EncryptedPayload,
			privateKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
			expected: {
				content: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
				headers: SerializableTransportPayloadHeaders.FromEncryptedPayloadHeaders({
					Origin: AliceED25519PublicKey,
					ContentSignature: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
					Created: new Date(1000),
					ContentLength: 5000,
					ContentType: 'message/x.mailchain',
					ContentEncoding: 'base64/plain',
					ContentEncryption: KindNaClSecretKey,
				} as PayloadHeaders).ToBuffer(),
			},
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, async () => {
			const target = decryptPayload;
			if (test.shouldThrow) {
				expect.assertions(1);
				try {
					target(test.input, test.privateKey);
				} catch (e) {
					expect(e).toBeDefined();
				}
			} else {
				return target(test.input, test.privateKey).then((actual) => {
					expect(actual).toEqual(test.expected);
				});
			}
		});
	});
});
