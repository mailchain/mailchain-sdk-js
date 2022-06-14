import { protocol } from '@mailchain/api/protobuf/protocol/protocol';
import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PrivateKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';

import { createECDHKeyBundle } from './keybundle';

describe('createECDHKeyBundle', () => {
	const tests = [
		{
			name: 'alice',
			pubKey: AliceED25519PublicKey,
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(
					Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii'),
				).slice(0, num);
			},
			expected: {
				secret: new Uint8Array([
					90, 58, 100, 224, 143, 70, 111, 26, 22, 78, 53, 178, 8, 9, 24, 161, 134, 127, 229, 2, 144, 28, 121,
					198, 194, 42, 114, 157, 74, 227, 142, 35,
				]),
				keyBundle: {
					publicMessagingKey: new Uint8Array([
						226, 114, 60, 170, 35, 165, 181, 17, 175, 90, 215, 183, 239, 96, 118, 228, 20, 171, 126, 117,
						169, 220, 145, 14, 166, 14, 65, 122, 43, 119, 10, 86, 113,
					]),
					publicEphemeralKey: new Uint8Array([
						226, 128, 86, 236, 191, 60, 197, 172, 209, 96, 221, 240, 34, 151, 187, 186, 161, 85, 91, 222,
						160, 4, 194, 155, 169, 150, 72, 137, 225, 220, 205, 1, 91,
					]),
				},
			},
			shouldThrow: false,
		},
		{
			name: 'bob',
			pubKey: BobED25519PublicKey,
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(
					Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii'),
				).slice(0, num);
			},
			shouldThrow: false,
			expected: {
				secret: new Uint8Array([
					92, 155, 193, 185, 248, 74, 80, 15, 210, 109, 221, 111, 11, 135, 246, 196, 47, 229, 190, 28, 152,
					90, 112, 132, 248, 5, 53, 202, 70, 77, 0, 47,
				]),
				keyBundle: {
					publicMessagingKey: new Uint8Array([
						226, 46, 50, 47, 135, 64, 198, 1, 114, 17, 26, 200, 234, 220, 221, 162, 81, 47, 144, 208, 109,
						14, 80, 62, 241, 137, 151, 154, 21, 155, 236, 225, 232,
					]),
					publicEphemeralKey: new Uint8Array([
						226, 128, 86, 236, 191, 60, 197, 172, 209, 96, 221, 240, 34, 151, 187, 186, 161, 85, 91, 222,
						160, 4, 194, 155, 169, 150, 72, 137, 225, 220, 205, 1, 91,
					]),
				},
			},
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect.assertions(1);
				return createECDHKeyBundle(test.pubKey, test.rand).catch((e) => expect(e).toBeDefined());
			}
			return createECDHKeyBundle(test.pubKey, test.rand).then((actual) => {
				expect(actual).toEqual(test.expected);
			});
		});
	});
});
