import { mock } from 'jest-mock-extended';
import {
	AddressesApiInterface,
	GetIdentityKeyAddressesResponseBody,
	GetIdentityKeyResponseBody,
	IdentityKeysApiInterface,
} from '@mailchain/api';
import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import { publicKeyToBytes } from '@mailchain/crypto';
import { AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { encodeHexZeroX } from '@mailchain/encoding';
import { AxiosError, AxiosResponse } from 'axios';
import { IdentityKeys } from './identityKeys';

describe('identityKeys', () => {
	let identityKeys: IdentityKeys;
	const mockAddressesApi = mock<AddressesApiInterface>();
	const mockIdentityKeysApi = mock<IdentityKeysApiInterface>();

	beforeEach(() => {
		jest.clearAllMocks();
		identityKeys = new IdentityKeys(mockAddressesApi, mockIdentityKeysApi);
	});

	it('should resolve identity key', async () => {
		mockAddressesApi.getAddressIdentityKey.mockResolvedValue({
			data: {
				identityKey: encodeHexZeroX(publicKeyToBytes(AliceSECP256K1PublicKey)),
				protocol: 'ethereum',
			},
		} as AxiosResponse<GetIdentityKeyResponseBody>);

		const result = await identityKeys.resolve(`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`);

		expect(result).toEqual({
			identityKey: AliceSECP256K1PublicKey,
			protocol: 'ethereum',
		});
		expect(mockAddressesApi.getAddressIdentityKey).toHaveBeenCalledWith(
			`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`,
			undefined,
		);
	});

	it('should resolve identity key with at particular date', async () => {
		mockAddressesApi.getAddressIdentityKey.mockResolvedValue({
			data: {
				identityKey: encodeHexZeroX(publicKeyToBytes(AliceSECP256K1PublicKey)),
				protocol: 'ethereum',
			},
		} as AxiosResponse<GetIdentityKeyResponseBody>);

		const result = await identityKeys.resolve(
			`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`,
			new Date('2022-05-19T08:00:00.000Z'),
		);

		expect(result).toEqual({
			identityKey: AliceSECP256K1PublicKey,
			protocol: 'ethereum',
		});
		expect(mockAddressesApi.getAddressIdentityKey).toHaveBeenCalledWith(
			`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`,
			1652947200,
		);
	});

	it('should return null when the api responds with 404', async () => {
		mockAddressesApi.getAddressIdentityKey.mockRejectedValue(
			new AxiosError('', '404', undefined, undefined, {
				status: 404,
				data: {},
			} as any),
		);

		const result = await identityKeys.resolve(`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`);

		expect(result).toEqual(null);
	});

	it('should return null when the api responds with identity_not_found', async () => {
		mockAddressesApi.getAddressIdentityKey.mockRejectedValue(
			new AxiosError('', '0', undefined, undefined, {
				status: -1,
				data: {
					code: 'identity_not_found',
				},
			} as any),
		);

		const result = await identityKeys.resolve(`${AliceSECP256K1PublicAddressStr}@ethereum.mailchain.test`);

		expect(result).toEqual(null);
	});

	it('should reverse lookup address by identity key', async () => {
		const addresses = [
			{
				encoding: 'hex/0x-prefix',
				protocol: 'ethereum',
				value: AliceSECP256K1PublicAddressStr,
				network: 'mainnet',
			},
		];
		mockIdentityKeysApi.getIdentityKeyAddresses.mockResolvedValue({
			data: { addresses },
		} as AxiosResponse<GetIdentityKeyAddressesResponseBody>);

		const result = await identityKeys.reverse(AliceSECP256K1PublicKey);

		expect(result).toEqual(addresses);
	});
});
