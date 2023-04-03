import { ErrorUnsupportedKey } from '@mailchain/crypto';
import {
	AliceSECP256K1PrivateKey,
	AliceSECP256K1PublicKey,
	BobSECP256K1PrivateKey,
	BobSECP256K1PublicKey,
} from '@mailchain/crypto/secp256k1/test.const';
import {
	AliceSECP256R1PrivateKey,
	AliceSECP256R1PublicKey,
	BobSECP256R1PrivateKey,
	BobSECP256R1PublicKey,
} from '@mailchain/crypto/secp256r1/test.const';
import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PrivateKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { decodeHex, encodeHex } from '@mailchain/encoding';
import { signTezosMessage, verifyTezosSignedMessage } from './tezos_micheline';

describe('VerifyTezosMicheline', () => {
	const tests = [
		{
			name: `ed25519-alice`,
			args: {
				key: AliceED25519PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'162dd6c02923c76625bb1b3ce01f5d9da73509cde1fdf8840c91655cdd2ad580d80a9ebc760876f00dca06e2df886606cb51556c52de1b0e4b8aaa077559ce0f',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `ed25519-alice-incorrect-message`,
			args: {
				key: AliceED25519PublicKey,
				message: 'incorrect-message',
				signature: decodeHex(
					'1c12fe7562da27a3205d4c3259368d64b974a62094263b3b2605565dc004398ce5b33ad1d48e26ce673785020e4be395e1b99f16df17146d4903fcc5cd1ba901',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `ed25519-bob`,
			args: {
				key: BobED25519PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'd34e5d0fc98d68e51e08fe0961cb6cd122772269dd9cc5cfe8687195434ea48aaeaa583d87c5d6f3d2170e765fa73e8d9cf05761cedbb208a0ee7fcec379b103',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-alice`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'950da634c5e8d60b8a784ae3bd38c16868608a56a0626fb1dfb2a5d2fc27b52d1395966157b429d7027ab77f2bbd6fe5a000822abb84b897334d3ac4abade13b',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-alice-incorrect-message`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: 'incorrect-message',
				signature: decodeHex(
					'950da634c5e8d60b8a784ae3bd38c16868608a56a0626fb1dfb2a5d2fc27b52d1395966157b429d7027ab77f2bbd6fe5a000822abb84b897334d3ac4abade13b',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `secp256k1-bob`,
			args: {
				key: BobSECP256K1PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'cd05d8bd85c9bda330d86ae9b452019ccac35a9e0f9b754df35d2119bf5cb9f036d8a8ded015e03129c7ffd3a22aa15b89e3b6e93f795dd3ff0d0784428ba73a',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-alice`,
			args: {
				key: AliceSECP256R1PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'9576f7ed626445371ea3aac72cbe522fe44de367ddd5a206cfda05580614df991233757851c1a892dd5bfcc40314b01808966e38657c82e1963266ba84b79aee',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-alice-incorrect-message`,
			args: {
				key: AliceSECP256R1PublicKey,
				message: 'incorrect-message',
				signature: decodeHex(
					'9975023186d8d0650c1c75a5fab72bf2b9edc301e5884045a50d0f15cd5f9f7776245b496af636fee2e7b12145b5ed473a44ba15c71040ef133d9f2058bd30c6',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `secp256r1-bob`,
			args: {
				key: BobSECP256R1PublicKey,
				message: 'hello from mailchain',
				signature: decodeHex(
					'bc8d28f87f00912eb9e9d508f7bf4f1949f45607903e8325bc9e2e00f6a0f9fe741c449863b3d1e12128552a14625ced3d6884a64f0ae3ce245df472388fddde',
				),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-alice-incorrect-message`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: 'incorrect-message',
				signature: decodeHex(
					'c11f460a7a5f29fb0f5a4a414eb0b3745ba2e548ca5a0eb1c1aa4fa2a42a093a6edad01cbc57ec0e6e3127dec85a1f32fb7dec8836d69469d9cd80c257d31b2f',
				),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `secp256r1-alice-incorrect-message`,
			args: {
				key: AliceSECP256R1PublicKey,
				message: 'incorrect-message',
				signature: decodeHex(
					'1d01c9ccdb313554d0a945f871f021a262694174275c67f2032652c42940c7963ea02de1ef5521fd4ff0b20fd38bf67037030b3a39a2b7aa7ef76259d6f75ed7',
				),
			},
			expected: false,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				return verifyTezosSignedMessage(test.args.key, test.args.message, test.args.signature);
			}).rejects.toThrow(ErrorUnsupportedKey);
		} else {
			expect(await verifyTezosSignedMessage(test.args.key, test.args.message, test.args.signature)).toEqual(
				test.expected,
			);
		}
	});
});

describe('SignTezosMicheline', () => {
	const tests = [
		{
			name: 'ed25519-alice',
			args: {
				signingKey: AliceED25519PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'162dd6c02923c76625bb1b3ce01f5d9da73509cde1fdf8840c91655cdd2ad580d80a9ebc760876f00dca06e2df886606cb51556c52de1b0e4b8aaa077559ce0f',
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			args: {
				signingKey: BobED25519PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'd34e5d0fc98d68e51e08fe0961cb6cd122772269dd9cc5cfe8687195434ea48aaeaa583d87c5d6f3d2170e765fa73e8d9cf05761cedbb208a0ee7fcec379b103',
			shouldThrow: false,
		},
		{
			name: 'secp256k1-alice',
			args: {
				signingKey: AliceSECP256K1PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'950da634c5e8d60b8a784ae3bd38c16868608a56a0626fb1dfb2a5d2fc27b52d1395966157b429d7027ab77f2bbd6fe5a000822abb84b897334d3ac4abade13b',
			shouldThrow: false,
		},
		{
			name: 'secp256k1-bob',
			args: {
				signingKey: BobSECP256K1PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'cd05d8bd85c9bda330d86ae9b452019ccac35a9e0f9b754df35d2119bf5cb9f036d8a8ded015e03129c7ffd3a22aa15b89e3b6e93f795dd3ff0d0784428ba73a',
			shouldThrow: false,
		},
		{
			name: 'secp256r1-alice',
			args: {
				signingKey: AliceSECP256R1PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'9576f7ed626445371ea3aac72cbe522fe44de367ddd5a206cfda05580614df991233757851c1a892dd5bfcc40314b01808966e38657c82e1963266ba84b79aee',
			shouldThrow: false,
		},
		{
			name: 'secp256r1-bob',
			args: {
				signingKey: BobSECP256R1PrivateKey,
				msg: 'hello from mailchain',
			},
			expected:
				'bc8d28f87f00912eb9e9d508f7bf4f1949f45607903e8325bc9e2e00f6a0f9fe741c449863b3d1e12128552a14625ced3d6884a64f0ae3ce245df472388fddde',
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				return signTezosMessage(test.args.signingKey, test.args.msg);
			}).rejects.toThrow(ErrorUnsupportedKey);
		} else {
			expect(encodeHex(await signTezosMessage(test.args.signingKey, test.args.msg))).toEqual(test.expected);
		}
	});
});

describe('roundtrip tezos sign-verify', () => {
	const tests = [
		{
			name: `ed25519-alice`,
			args: {
				key: AliceED25519PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `ed25519-bob`,
			args: {
				key: BobED25519PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-alice`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-bob`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-alice`,
			args: {
				key: AliceSECP256R1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-bob`,
			args: {
				key: AliceSECP256R1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256k1-bob`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-alice`,
			args: {
				key: AliceSECP256R1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `secp256r1-bob`,
			args: {
				key: AliceSECP256R1PrivateKey,
				message: 'hello from mailchain',
			},
			expected: true,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			const signature = await signTezosMessage(test.args.key, test.args.message);
			expect(() => {
				return verifyTezosSignedMessage(test.args.key.publicKey, test.args.message, signature);
			}).rejects.toThrow(ErrorUnsupportedKey);
		} else {
			const signature = await signTezosMessage(test.args.key, test.args.message);
			expect(await verifyTezosSignedMessage(test.args.key.publicKey, test.args.message, signature)).toEqual(
				test.expected,
			);
		}
	});
});
