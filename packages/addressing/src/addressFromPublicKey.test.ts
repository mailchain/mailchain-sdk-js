import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { addressFromPublicKey } from './addressFromPublicKey';
import { ETHEREUM } from './protocols';
import { AliceSECP256K1PublicAddress, BobSECP256K1PublicAddress } from './protocols/ethereum/test.const';

const testCases = [
	{
		caseName: 'ethereum address',
		publicKey: AliceSECP256K1PublicKey,
		protocol: ETHEREUM,
		expectedAddress: AliceSECP256K1PublicAddress,
	},
	{
		caseName: 'ethereum address',
		publicKey: BobSECP256K1PublicKey,
		protocol: ETHEREUM,
		expectedAddress: BobSECP256K1PublicAddress,
	},
];

test.each(testCases)('$caseName', async ({ publicKey, protocol, expectedAddress }) => {
	const result = await addressFromPublicKey(publicKey, protocol);

	expect(result).toEqual(expectedAddress);
});
