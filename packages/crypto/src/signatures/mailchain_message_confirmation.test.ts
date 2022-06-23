import { DecodeHex, EncodeHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring/keyring';
import { secureRandom } from '../rand';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from '../ed25519/test.const';
import { AliceSECP256K1PrivateKey } from '../secp256k1/test.const';
import {
	mailchainDeliveryConfirmationMessage,
	signMailchainDeliveryConfirmation,
} from './mailchain_message_confirmation';

import { ErrorUnsupportedKey } from './errors';

describe('acknowledge receiving message', () => {
	test('message formatted properly', () => {
		const arrays = [
			new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]),
			secureRandom(),
			secureRandom(),
			secureRandom(),
			secureRandom(),
		];
		arrays.forEach((arr) => {
			expect(mailchainDeliveryConfirmationMessage(arr)).toEqual(
				Buffer.from(`\x11Mailchain delivery confirmation:\n${EncodeHex(arr)}`, 'utf-8'),
			);
		});
	});
});
describe('signing is correct', () => {
	const tests = [
		{
			name: `alice-ed25519`,
			args: {
				keyRing: KeyRing.fromPrivateKey(AliceED25519PrivateKey),
				signature: DecodeHex(
					'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
				),
			},
			expected: new Uint8Array([
				91, 85, 153, 147, 4, 248, 4, 156, 134, 239, 204, 40, 144, 15, 222, 177, 186, 26, 54, 70, 183, 25, 196,
				84, 93, 63, 100, 153, 10, 38, 168, 129, 13, 205, 129, 178, 128, 175, 78, 109, 107, 171, 74, 104, 48,
				213, 100, 25, 145, 55, 14, 23, 17, 183, 52, 133, 0, 39, 135, 106, 93, 177, 167, 13,
			]),
			shouldThrow: false,
		},
		{
			name: `bob-ed25519`,
			args: {
				keyRing: KeyRing.fromPrivateKey(BobED25519PrivateKey),
				signature: DecodeHex(
					'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
				),
			},
			expected: new Uint8Array([
				38, 0, 147, 51, 204, 227, 227, 10, 70, 218, 249, 81, 73, 169, 229, 215, 110, 166, 176, 198, 62, 243, 31,
				11, 253, 120, 145, 195, 25, 171, 36, 222, 104, 89, 162, 156, 252, 203, 54, 230, 168, 254, 72, 173, 151,
				243, 181, 234, 201, 53, 169, 121, 206, 231, 98, 8, 25, 230, 55, 27, 225, 61, 253, 5,
			]),
			shouldThrow: false,
		},
	];
	tests.forEach(async (test) => {
		it(test.name, async () => {
			if (test.shouldThrow) {
				expect(async () => {
					await signMailchainDeliveryConfirmation(
						test.args.keyRing.accountMessagingKey(),
						test.args.signature,
					);
				}).toThrowError(ErrorUnsupportedKey);
			} else {
				expect(
					await signMailchainDeliveryConfirmation(
						test.args.keyRing.accountMessagingKey(),
						test.args.signature,
					),
				).toEqual(test.expected);
			}
		});
	});
});
