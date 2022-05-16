import { DecodeHex } from '@mailchain/encoding';
import {
	AliceSR25519PrivateKey,
	BobSR25519PrivateKey,
	EveSR25519PrivateKey,
	BobSR25519PublicKey,
	AliceSR25519PublicKey,
	EveSR25519PublicKey,
} from '@mailchain/crypto/sr25519/test.const';
import { SR25519PrivateKey } from '../../sr25519';
import { SR25519KeyExchange } from './';

describe('shared-secret', () => {
	const tests = [
		{
			name: 'success-bob-alice',
			prvKey: BobSR25519PrivateKey,
			pubKey: AliceSR25519PublicKey,
			expected: DecodeHex('12876c345ce0daf1a74f5191f465c8fd7f9088da7a013b65bef146cfad38b436'),
			shouldThrow: false,
		},
		{
			name: 'success-alice-bob',
			prvKey: AliceSR25519PrivateKey,
			pubKey: BobSR25519PublicKey,
			expected: DecodeHex('12876c345ce0daf1a74f5191f465c8fd7f9088da7a013b65bef146cfad38b436'),
			shouldThrow: false,
		},
		{
			name: 'success-alice-eve',
			prvKey: AliceSR25519PrivateKey,
			pubKey: EveSR25519PublicKey,
			expected: DecodeHex('d63808d69cfe18eaf0dde2b784f34f9ea9148f7806aaf5b4b82ef23a37944a6a'),
			shouldThrow: false,
		},
		{
			name: 'success-eve-alice',
			prvKey: EveSR25519PrivateKey,
			pubKey: AliceSR25519PublicKey,
			expected: DecodeHex('d63808d69cfe18eaf0dde2b784f34f9ea9148f7806aaf5b4b82ef23a37944a6a'),
			shouldThrow: false,
		},
		{
			name: 'success-bob-eve',
			prvKey: BobSR25519PrivateKey,
			pubKey: EveSR25519PublicKey,
			expected: DecodeHex('1406657dbcbb7031e44d401623c3c3d47d1c3d84bb511049e5f9e04262aede1d'),
			shouldThrow: false,
		},
		{
			name: 'success-eve-bob',
			prvKey: EveSR25519PrivateKey,
			pubKey: BobSR25519PublicKey,
			expected: DecodeHex('1406657dbcbb7031e44d401623c3c3d47d1c3d84bb511049e5f9e04262aede1d'),
			shouldThrow: false,
		},
		{
			name: 'err-alice-alice',
			prvKey: AliceSR25519PrivateKey,
			pubKey: AliceSR25519PublicKey,
			expected: null,
			shouldThrow: true,
		},
		{
			name: 'err-bob-bob',
			prvKey: BobSR25519PrivateKey,
			pubKey: BobSR25519PublicKey,
			expected: null,
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const target = new SR25519KeyExchange((num?: number): Uint8Array => {
				return new Uint8Array([]);
			});
			if (test.shouldThrow) {
				expect.assertions(1);
				return target.SharedSecret(test.prvKey, test.pubKey).catch((e) => expect(e).toBeDefined());
			}
			return target.SharedSecret(test.prvKey, test.pubKey).then((actual) => {
				expect(actual).toEqual(test.expected);
			});
		});
	});
});

describe('shared-secret-wasm-compatibility', () => {
	// test cases from https://github.com/polkadot-js/wasm/blob/master/packages/wasm-crypto/src/rs/sr25519.rs#L306
	it('key-agreement', async () => {
		const target = new SR25519KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});

		const self = await SR25519PrivateKey.FromSeed(
			DecodeHex('98b3d305d5a5eace562387e47e59badd4d77e3f72cabfb10a60f8a197059f0a8'),
		);
		const other = await SR25519PrivateKey.FromSeed(
			DecodeHex('9732eea001851ff862d949a1699c9971f3a26edbede2ad7922cbbe9a0701f366'),
		);

		const expected = DecodeHex('b03a0b198c34c16f35cae933d88b16341b4cef3e84e851f20e664c6a30527f4e');

		expect(await target.SharedSecret(self, other.PublicKey)).toEqual(expected);
		expect(await target.SharedSecret(other, self.PublicKey)).toEqual(expected);
	});

	it('key-agreement-random-keys', async () => {
		const target = new SR25519KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});

		const self = await SR25519PrivateKey.Generate();
		const other = await SR25519PrivateKey.Generate();

		expect(await target.SharedSecret(self, other.PublicKey)).toEqual(
			await target.SharedSecret(other, self.PublicKey),
		);
	});
});
