import { decodeHex } from '@mailchain/encoding/hex';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceED25519PublicKey } from '../../../../crypto/src/ed25519/test.const';
import { verifyEthereumPersonalMessage } from './eth_personal';
import { ErrorUnsupportedKey } from './errors';

describe('VerifyEthereumPersonalMessage', () => {
	const tests = [
		{
			name: `alice-secp256k1`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: Buffer.from('hello', 'utf-8'),
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
				message: Buffer.from('wrong message', 'utf-8'),
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
				message: Buffer.from('hello', 'utf-8'),
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
				message: Buffer.from('wrong message', 'utf-8'),
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
				message: Buffer.from('hello', 'utf-8'),
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
				verifyEthereumPersonalMessage(test.args.key, test.args.message, test.args.signature);
			}).toThrowError(ErrorUnsupportedKey);
		} else {
			expect(verifyEthereumPersonalMessage(test.args.key, test.args.message, test.args.signature)).toEqual(
				test.expected,
			);
		}
	});
});
