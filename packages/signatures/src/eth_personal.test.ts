import { decodeHex, decodeUtf8 } from '@mailchain/encoding';
import {
	AliceSECP256K1PrivateKey,
	AliceSECP256K1PublicKey,
	BobSECP256K1PrivateKey,
	BobSECP256K1PublicKey,
} from '@mailchain/crypto/secp256k1/test.const';
import { AliceED25519PrivateKey, AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { ErrorUnsupportedKey } from '@mailchain/crypto';
import { signEthereumPersonalMessage, verifyEthereumPersonalMessage } from './eth_personal';

describe('verifyEthereumPersonalMessage', () => {
	const tests = [
		{
			name: `alice-secp256k1`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: decodeUtf8('hello'),
				signature: decodeHex(
					'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-alice-incorrect-message`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: decodeUtf8('wrong message'),
				signature: decodeHex(
					'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `bob-secp256k1`,
			args: {
				key: BobSECP256K1PublicKey,
				message: decodeUtf8('hello'),
				signature: decodeHex(
					'cbf4e3962fd6e9c711cb622bceb4205649437792c395a772fe452e802964a91a6734bbd6cbad4a42fa57fe2f2a664ef627152a0cf257f0341b0f960c224422881b',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-bob-incorrect-message`,
			args: {
				key: BobSECP256K1PublicKey,
				message: decodeUtf8('wrong message'),
				signature: decodeHex(
					'cbf4e3962fd6e9c711cb622bceb4205649437792c395a772fe452e802964a91a6734bbd6cbad4a42fa57fe2f2a664ef627152a0cf257f0341b0f960c224422881b',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `invalid-curve-ed25519`,
			args: {
				key: AliceED25519PublicKey,
				message: decodeUtf8('hello'),
				signature: decodeHex(
					'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
				),
			},
			expected: false,
			shouldThrow: ErrorUnsupportedKey,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				return verifyEthereumPersonalMessage(test.args.key, test.args.message, test.args.signature);
			}).rejects.toThrow(ErrorUnsupportedKey);
		} else {
			expect(await verifyEthereumPersonalMessage(test.args.key, test.args.message, test.args.signature)).toEqual(
				test.expected,
			);
		}
	});
});

describe('SignPersonalMessage', () => {
	const tests = [
		{
			name: `alice-secp256k1`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: decodeUtf8('hello'),
			},
			expected: decodeHex(
				'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf12201',
			),
			shouldThrow: false,
		},
		{
			name: `bob-secp256k1`,
			args: {
				key: BobSECP256K1PrivateKey,
				message: decodeUtf8('hello'),
			},
			expected: decodeHex(
				'cbf4e3962fd6e9c711cb622bceb4205649437792c395a772fe452e802964a91a6734bbd6cbad4a42fa57fe2f2a664ef627152a0cf257f0341b0f960c2244228800',
			),
			shouldThrow: false,
		},
		{
			name: `invalid-curve-ed25519`,
			args: {
				key: AliceED25519PrivateKey,
				message: decodeUtf8('hello'),
			},
			expected: decodeHex(
				'1a8cb54a9fd44f18e0799b081fb725b54409e46f9d6ddb2c2e720de1c60c66030a9038c28a2d0c5a68def8fcb5359ca7bceb5afe943424d610fa91cda27cf1221c',
			),
			shouldThrow: ErrorUnsupportedKey,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				return signEthereumPersonalMessage(test.args.key, test.args.message);
			}).rejects.toThrow(ErrorUnsupportedKey);
		} else {
			expect(await signEthereumPersonalMessage(test.args.key, test.args.message)).toEqual(test.expected);
		}
	});
});
