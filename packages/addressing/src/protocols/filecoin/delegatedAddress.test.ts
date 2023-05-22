import { secureRandom } from '@mailchain/crypto';
import { decodeHexZeroX, encodeHexZeroX, encodeUtf8 } from '@mailchain/encoding';
import { AliceFilEthAddressStr, AliceFilStr, BobFilEthAddressStr, BobFilAddressStr } from './const';
import { convertEthAddressToFilDelegated, convertFilDelegatedAddressToEthAddress } from './delegatedAddress';

const validCases = [
	{ filAddress: AliceFilStr, ethAddress: AliceFilEthAddressStr },
	{ filAddress: BobFilAddressStr, ethAddress: BobFilEthAddressStr },
	// https://docs.filecoin.io/smart-contracts/filecoin-evm-runtime/address-types/#example
	{
		filAddress: 't410f2oekwcmo2pueydmaq53eic2i62crtbeyuzx2gmy',
		ethAddress: '0xd388ab098ed3e84c0d808776440b48f685198498',
	},
	{
		filAddress: 'f410f2oekwcmo2pueydmaq53eic2i62crtbeyuzx2gmy',
		ethAddress: '0xd388ab098ed3e84c0d808776440b48f685198498',
	},
	{
		filAddress: 't410fl5qeigmkcytz7b6sqoojtcetqwf37dm4zv4aijq',
		ethAddress: '0x5f6044198a16279f87d2839c998893858bbf8d9c',
	},
	{
		filAddress: 'f410fl5qeigmkcytz7b6sqoojtcetqwf37dm4zv4aijq',
		ethAddress: '0x5f6044198a16279f87d2839c998893858bbf8d9c',
	},
];

const invalidFilToEth = [
	{
		name: 'Invalid prefix',
		filAddress: 'c410fl5qeigmkcytz7b6sqoojtcetqwf37dm4zv4aijq',
	},
	{
		name: 'Invalid namespace (11 instead of 10)',
		filAddress: 'f411fl5qeigmkcytz7b6sqoojtcetqwf37dm4nuutwvq',
	},
	{
		name: 'Invalid Ethereum address length (19 instead of 20)',
		filAddress: 'f410fnc2ymiryxbxroxcunvomrqrj7wagnigpv4e3i',
	},
	{
		name: 'Invalid checksum',
		filAddress: 't410fl5qeigmkcytz7b6sqoojtcetqwf37dm4zv4ajiq',
	},
];

const invalidEthToFil = [
	{
		name: 'Invalid length (19 instead of 20)',
		ethAddress: encodeHexZeroX(secureRandom(19)),
	},
	{
		name: 'Invalid length (21 instead of 20)',
		ethAddress: encodeHexZeroX(secureRandom(21)),
	},
];

describe('FIL->ETH', () => {
	test.each(validCases)('$filAddress->$ethAddress', ({ filAddress, ethAddress }) => {
		const { data, error } = convertFilDelegatedAddressToEthAddress(filAddress);
		expect(error).toBeUndefined();
		if (!data) {
			throw new Error('data is undefined');
		}
		expect(encodeHexZeroX(data)).toEqual(ethAddress);
	});

	test.each(invalidFilToEth)('$name $filAddress', async ({ filAddress }) => {
		const { data, error } = convertFilDelegatedAddressToEthAddress(filAddress);
		expect(data).toBeUndefined();
		expect(error).toBeDefined();
	});
});

describe('ETH->FIL', () => {
	test.each(validCases)('$ethAddress->$filAddress', ({ filAddress, ethAddress }) => {
		const result = convertEthAddressToFilDelegated(decodeHexZeroX(ethAddress), filAddress.charAt(0) as 'f' | 't');

		expect(encodeUtf8(result)).toEqual(filAddress);
	});
	test.each(invalidEthToFil)('$name $ethAddress', async ({ ethAddress }) => {
		expect(() => convertEthAddressToFilDelegated(decodeHexZeroX(ethAddress))).toThrow();
	});
});
