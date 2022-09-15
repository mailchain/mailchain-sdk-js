import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSECP256K1PublicAddress, BobSECP256K1PublicAddress } from './test.const';
import { addressFromPublicKey } from './address';

describe('addressFromPublicKey', () => {
	const tests = [
		{
			name: 'alice',
			publicKey: AliceSECP256K1PublicKey,
			expected: AliceSECP256K1PublicAddress,
			shouldThrow: false,
		},
		{
			name: 'bob',
			publicKey: BobSECP256K1PublicKey,
			expected: BobSECP256K1PublicAddress,
			shouldThrow: false,
		},
		{
			name: 'incorrect key',
			publicKey: AliceED25519PublicKey,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(async () => {
				await addressFromPublicKey(test.publicKey);
			}).rejects.toThrow();
		} else {
			expect(await addressFromPublicKey(test.publicKey)).toEqual(test.expected);
		}
	});
});
