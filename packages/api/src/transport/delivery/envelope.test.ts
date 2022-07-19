/* eslint-disable @typescript-eslint/naming-convention */
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519/exprivate';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519/private';
import { DecodeHex } from '@mailchain/encoding';
import { protocol } from '../../protobuf/protocol/protocol';
import { createEnvelope } from './envelope';

describe('createEnvelope', () => {
	const tests = [
		{
			name: 'alice',
			pubKey: AliceED25519PublicKey,
			messageKey: ED25519ExtendedPrivateKey.fromPrivateKey(
				ED25519PrivateKey.fromSeed(
					DecodeHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
				),
			),
			messageURI: 'https://mcx.mx/01234567890123456789',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(
					Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii'),
				).slice(0, num);
			},
			expected: {
				encryptedMessageKey: new Uint8Array([
					43, 226, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87,
					88, 240, 2, 210, 68, 80, 115, 235, 60, 202, 5, 173, 170, 97, 141, 179, 194, 67, 118, 35, 98, 238,
					171, 243, 161, 105, 96, 188, 241, 37, 162, 136, 224, 51, 218, 187, 9, 147, 188, 208, 240, 76, 125,
					253, 253, 73, 236, 87, 18, 149, 97, 53, 243, 6, 131, 139, 214, 166, 224, 113, 32, 69, 143, 72, 244,
					170, 35, 15, 168, 15, 196, 41, 74, 183, 58, 46, 127, 52, 248, 115, 5, 41,
				]),
				encryptedMessageUri: new Uint8Array([
					43, 226, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87,
					88, 67, 9, 204, 195, 103, 59, 71, 156, 24, 90, 74, 172, 57, 199, 197, 89, 201, 2, 86, 16, 158, 149,
					217, 136, 3, 11, 205, 213, 67, 214, 170, 222, 13, 248, 153, 47, 181, 158, 242, 222, 98, 85, 213,
					213, 97, 196, 127, 58, 189, 90, 173,
				]),
				ecdhKeyBundle: {
					publicMessagingKey: new Uint8Array([
						226, 114, 60, 170, 35, 165, 181, 17, 175, 90, 215, 183, 239, 96, 118, 228, 20, 171, 126, 117,
						169, 220, 145, 14, 166, 14, 65, 122, 43, 119, 10, 86, 113,
					]),
					publicEphemeralKey: new Uint8Array([
						226, 128, 86, 236, 191, 60, 197, 172, 209, 96, 221, 240, 34, 151, 187, 186, 161, 85, 91, 222,
						160, 4, 194, 155, 169, 150, 72, 137, 225, 220, 205, 1, 91,
					]),
				} as protocol.IECDHKeyBundle,
			} as protocol.IEnvelope,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			return createEnvelope(test.pubKey, test.messageKey, test.messageURI, test.rand).catch((e) =>
				expect(e).toBeDefined(),
			);
		}
		return createEnvelope(test.pubKey, test.messageKey, test.messageURI, test.rand).then((actual) => {
			expect(actual as protocol.IEnvelope).toEqual(test.expected);
		});
	});
});
