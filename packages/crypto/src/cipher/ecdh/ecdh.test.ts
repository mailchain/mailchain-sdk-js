import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSR25519PublicKey } from '@mailchain/crypto/sr25519/test.const';
import { AliceUnknownPublicKey } from '../../testing/public';
import { ED25519KeyExchange, SECP256K1KeyExchange, fromPublicKey, SR25519KeyExchange } from './';

describe('FromPublicKey', () => {
	const tests = [
		{
			name: 'creates-ed25519-key-exchange',
			key: AliceED25519PublicKey,
			expected: ED25519KeyExchange,
			shouldThrow: false,
		},
		{
			name: 'creates-secp256k1-key-exchange',
			key: AliceSECP256K1PublicKey,
			expected: SECP256K1KeyExchange,
			shouldThrow: false,
		},
		{
			name: 'creates-sr25519-key-exchange',
			key: AliceSR25519PublicKey,
			expected: SR25519KeyExchange,
			shouldThrow: false,
		},
		{
			name: 'fails-to-creates-with-unknown-key',
			key: AliceUnknownPublicKey,
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				fromPublicKey(test.key);
			}).toThrow();
		} else {
			expect(fromPublicKey(test.key).constructor).toEqual(test.expected);
		}
	});
});
