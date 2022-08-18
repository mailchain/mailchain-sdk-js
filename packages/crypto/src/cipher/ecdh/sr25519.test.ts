import {
	AliceSR25519PrivateKey,
	BobSR25519PrivateKey,
	EveSR25519PrivateKey,
	BobSR25519PublicKey,
	AliceSR25519PublicKey,
	EveSR25519PublicKey,
} from '../../sr25519/test.const';
import { SR25519PrivateKey } from '../../sr25519';
import { SR25519KeyExchange } from './sr25519';

describe('shared-secret', () => {
	const tests = [
		{
			name: 'success-bob-alice',
			prvKey: BobSR25519PrivateKey,
			pubKey: AliceSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('12876c345ce0daf1a74f5191f465c8fd7f9088da7a013b65bef146cfad38b436', 'hex'),
			),
			shouldThrow: false,
		},
		{
			name: 'success-alice-bob',
			prvKey: AliceSR25519PrivateKey,
			pubKey: BobSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('12876c345ce0daf1a74f5191f465c8fd7f9088da7a013b65bef146cfad38b436', 'hex'),
			),
			shouldThrow: false,
		},
		{
			name: 'success-alice-eve',
			prvKey: AliceSR25519PrivateKey,
			pubKey: EveSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('d63808d69cfe18eaf0dde2b784f34f9ea9148f7806aaf5b4b82ef23a37944a6a', 'hex'),
			),
			shouldThrow: false,
		},
		{
			name: 'success-eve-alice',
			prvKey: EveSR25519PrivateKey,
			pubKey: AliceSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('d63808d69cfe18eaf0dde2b784f34f9ea9148f7806aaf5b4b82ef23a37944a6a', 'hex'),
			),
			shouldThrow: false,
		},
		{
			name: 'success-bob-eve',
			prvKey: BobSR25519PrivateKey,
			pubKey: EveSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('1406657dbcbb7031e44d401623c3c3d47d1c3d84bb511049e5f9e04262aede1d', 'hex'),
			),
			shouldThrow: false,
		},
		{
			name: 'success-eve-bob',
			prvKey: EveSR25519PrivateKey,
			pubKey: BobSR25519PublicKey,
			expected: Uint8Array.from(
				Buffer.from('1406657dbcbb7031e44d401623c3c3d47d1c3d84bb511049e5f9e04262aede1d', 'hex'),
			),
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
	test.each(tests)('$name', async (test) => {
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

describe('shared-secret-wasm-compatibility', () => {
	// test cases from https://github.com/polkadot-js/wasm/blob/master/packages/wasm-crypto/src/rs/sr25519.rs#L306
	it('key-agreement', async () => {
		const target = new SR25519KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});

		const self = await SR25519PrivateKey.fromSeed(
			Uint8Array.from(Buffer.from('98b3d305d5a5eace562387e47e59badd4d77e3f72cabfb10a60f8a197059f0a8', 'hex')),
		);
		const other = await SR25519PrivateKey.fromSeed(
			Uint8Array.from(Buffer.from('9732eea001851ff862d949a1699c9971f3a26edbede2ad7922cbbe9a0701f366', 'hex')),
		);

		const expected = Uint8Array.from(
			Buffer.from('b03a0b198c34c16f35cae933d88b16341b4cef3e84e851f20e664c6a30527f4e', 'hex'),
		);

		expect(await target.SharedSecret(self, other.publicKey)).toEqual(expected);
		expect(await target.SharedSecret(other, self.publicKey)).toEqual(expected);
	});

	it('key-agreement-random-keys', async () => {
		const target = new SR25519KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});

		const self = await SR25519PrivateKey.generate();
		const other = await SR25519PrivateKey.generate();

		expect(await target.SharedSecret(self, other.publicKey)).toEqual(
			await target.SharedSecret(other, self.publicKey),
		);
	});
});
