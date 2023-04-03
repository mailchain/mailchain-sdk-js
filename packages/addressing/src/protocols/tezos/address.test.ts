import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSECP256R1PublicKey, BobSECP256R1PublicKey } from '@mailchain/crypto/secp256r1/test.const';
import { encodeBase58 } from '@mailchain/encoding';
import { tezosAddressFromPublicKey } from './address';
import {
	AliceTz1AddressStr,
	AliceTz2AddressStr,
	AliceTz3AddressStr,
	BobTz1AddressStr,
	BobTz2AddressStr,
	BobTz3AddressStr,
} from './test.const';

describe('addressFromPublicKey', () => {
	const tests = [
		{
			name: 'AliceED25519PublicKey',
			publicKey: AliceED25519PublicKey,
			address: AliceTz1AddressStr,
			shouldThrow: false,
		},
		{
			name: 'BobED25519PublicKey',
			publicKey: BobED25519PublicKey,
			address: BobTz1AddressStr,
			shouldThrow: false,
		},
		{
			name: 'AliceSECP256K1PublicKey',
			publicKey: AliceSECP256K1PublicKey,
			address: AliceTz2AddressStr,
			shouldThrow: false,
		},
		{
			name: 'BobSECP256K1PublicKey',
			publicKey: BobSECP256K1PublicKey,
			address: BobTz2AddressStr,
			shouldThrow: false,
		},
		{
			name: 'AliceSECP256R1PublicKey',
			publicKey: AliceSECP256R1PublicKey,
			address: AliceTz3AddressStr,
			shouldThrow: false,
		},
		{
			name: 'BobSECP256R1PublicKey',
			publicKey: BobSECP256R1PublicKey,
			address: BobTz3AddressStr,
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(tezosAddressFromPublicKey(test.publicKey)).rejects.toThrow();
		} else {
			const address = tezosAddressFromPublicKey(test.publicKey);
			expect(encodeBase58(address)).toEqual(test.address);
		}
	});
});
