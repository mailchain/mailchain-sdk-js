import { PublicKey } from '@mailchain/crypto';
import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { encodeBase58 } from '@mailchain/encoding';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSECP256R1PublicKey } from '@mailchain/crypto/secp256r1/test.const';
import { solanaAddressFromPublicKey, validateSolanaAddress } from './address';
import { AliceSolanaPublicAddressStr, BobSolanaPublicAddressStr } from './test.const';

describe('validateSolanaAddress', () => {
	const validAddresses = [
		'8z5rf3d7ExDYE7WjuxBKjPrKH5sbiEzAhEJCw6TkvSUJ',
		AliceSolanaPublicAddressStr,
		BobSolanaPublicAddressStr,
	];

	it.each(validAddresses)('address %s should be valid', (address) => {
		expect(validateSolanaAddress(address)).toBeTruthy();
	});
});

describe('solanaAddressFromPublicKey', () => {
	const validCases: { publicKey: PublicKey; expectedAddress: string }[] = [
		{
			publicKey: AliceED25519PublicKey,
			expectedAddress: AliceSolanaPublicAddressStr,
		},
		{
			publicKey: BobED25519PublicKey,
			expectedAddress: BobSolanaPublicAddressStr,
		},
	];

	it.each(validCases)('should return $expectedAddress', ({ publicKey, expectedAddress }) => {
		expect(encodeBase58(solanaAddressFromPublicKey(publicKey))).toEqual(expectedAddress);
	});

	const invalidCases: PublicKey[] = [
		AliceSECP256K1PublicKey,
		AliceSECP256R1PublicKey,
		BobSECP256K1PublicKey,
		{ ...AliceED25519PublicKey, bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) } as PublicKey,
	];

	it.each(invalidCases)('should fail getting solana address from public key $bytes', (publicKey) => {
		expect(() => solanaAddressFromPublicKey(publicKey)).toThrowError();
	});
});
