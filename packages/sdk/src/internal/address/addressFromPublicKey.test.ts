import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { addressFromPublicKey } from '../ethereum/address';
import { AliceSECP256K1PublicAddress, BobSECP256K1PublicAddress } from '../ethereum/test.const';

const testCases = [
	{ caseName: 'ethereum address', publicKey: AliceSECP256K1PublicKey, expectedAddress: AliceSECP256K1PublicAddress },
	{ caseName: 'ethereum address', publicKey: BobSECP256K1PublicKey, expectedAddress: BobSECP256K1PublicAddress },
];

test.each(testCases)('$caseName', async ({ publicKey, expectedAddress }) => {
	const result = await addressFromPublicKey(publicKey);

	expect(result).toEqual(expectedAddress);
});
