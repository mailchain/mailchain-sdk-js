import { ETHEREUM, NEAR } from '@mailchain/addressing/protocols';
import { GetProtocolAddressNonceResponseBody, MessagingKeysApiInterface } from '@mailchain/api';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { AddressNonce } from './addressNonce';
import { MessagingKeyNotFoundInContractError } from './contractResolvers/errors';
import { ContractCallLatestNonce } from './contractResolvers/resolver';

describe('getAddressNonce', () => {
	let mockMessagingKeysApi: MockProxy<MessagingKeysApiInterface>;
	let mockEthereumResolver: MockProxy<ContractCallLatestNonce>;
	let mockNearResolver: MockProxy<ContractCallLatestNonce>;

	let messagingKeyNonces: AddressNonce;

	beforeEach(() => {
		mockMessagingKeysApi = mock();
		mockMessagingKeysApi.getProtocolAddressNonce.mockResolvedValue({
			data: { contractCall: {} },
		} as AxiosResponse<GetProtocolAddressNonceResponseBody>);

		mockEthereumResolver = mock();
		mockNearResolver = mock();

		messagingKeyNonces = new AddressNonce(
			mockMessagingKeysApi,
			new Map([
				[ETHEREUM, mockEthereumResolver],
				[NEAR, mockNearResolver],
			]),
		);
	});

	it('should return nonce for Ethereum address of 0 contract response is not-found', async () => {
		mockEthereumResolver.latestNonce.mockRejectedValue(new MessagingKeyNotFoundInContractError());

		const { data: resultNonce, error } = await messagingKeyNonces.getMessagingKeyLatestNonce('0x1337', ETHEREUM);
		expect(error).toBeUndefined();
		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('0x1337', ETHEREUM);
		expect(mockEthereumResolver.latestNonce).toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).not.toHaveBeenCalled();
		expect(resultNonce).toEqual(0);
	});

	it('should return nonce for Ethereum address based on resolution', async () => {
		mockEthereumResolver.latestNonce.mockResolvedValue(9);

		const { data: resultNonce, error } = await messagingKeyNonces.getMessagingKeyLatestNonce('0x1337', ETHEREUM);

		expect(error).toBeUndefined();
		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('0x1337', ETHEREUM);
		expect(mockEthereumResolver.latestNonce).toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).not.toHaveBeenCalled();
		expect(resultNonce).toEqual(9);
	});

	it('should return nonce for Near address based on resolution', async () => {
		mockNearResolver.latestNonce.mockResolvedValue(9);

		const { data: resultNonce, error } = await messagingKeyNonces.getMessagingKeyLatestNonce('alice.near', NEAR);

		expect(error).toBeUndefined();
		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('alice.near', NEAR);
		expect(mockEthereumResolver.latestNonce).not.toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).toHaveBeenCalled();
		expect(resultNonce).toEqual(9);
	});

	it('should throw error when resolutions fails', async () => {
		mockEthereumResolver.latestNonce.mockRejectedValue(new Error());

		const { data: resultNonce, error } = await messagingKeyNonces.getMessagingKeyLatestNonce('0x1337', ETHEREUM);
		expect(error).toBeDefined();
		expect(error?.message).toEqual('Failed to get latest nonce.');

		expect(resultNonce).toBeUndefined();
	});
});
