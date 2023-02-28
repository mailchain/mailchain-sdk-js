import { ETHEREUM, NEAR } from '@mailchain/addressing/protocols';
import { GetProtocolAddressNonceResponseBody, MessagingKeysApiInterface } from '@mailchain/api/api';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { MessagingKeyNonces } from './addressNonce';
import { ContractCallLatestNonce } from './contractResolvers/resolver';

describe('getAddressNonce', () => {
	let mockMessagingKeysApi: MockProxy<MessagingKeysApiInterface>;
	let mockEthereumResolver: MockProxy<ContractCallLatestNonce>;
	let mockNearResolver: MockProxy<ContractCallLatestNonce>;

	let messagingKeyNonces: MessagingKeyNonces;

	beforeEach(() => {
		mockMessagingKeysApi = mock();
		mockMessagingKeysApi.getProtocolAddressNonce.mockResolvedValue({
			data: { contractCall: {} },
		} as AxiosResponse<GetProtocolAddressNonceResponseBody>);

		mockEthereumResolver = mock();
		mockNearResolver = mock();

		messagingKeyNonces = new MessagingKeyNonces(
			mockMessagingKeysApi,
			new Map([
				[ETHEREUM, mockEthereumResolver],
				[NEAR, mockNearResolver],
			]),
		);
	});

	it('should return nonce for Ethereum address of 0 contract response is not-found', async () => {
		mockEthereumResolver.latestNonce.mockResolvedValue({ status: 'not-found' });

		const resultNonce = await messagingKeyNonces.getAddressNonce('0x1337', ETHEREUM);

		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('0x1337', ETHEREUM);
		expect(mockEthereumResolver.latestNonce).toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).not.toHaveBeenCalled();
		expect(resultNonce).toEqual(0);
	});

	it('should return nonce for Ethereum address based on resolution', async () => {
		mockEthereumResolver.latestNonce.mockResolvedValue({ status: 'ok', nonce: 9 });

		const resultNonce = await messagingKeyNonces.getAddressNonce('0x1337', ETHEREUM);

		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('0x1337', ETHEREUM);
		expect(mockEthereumResolver.latestNonce).toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).not.toHaveBeenCalled();
		expect(resultNonce).toEqual(9);
	});

	it('should return nonce for Near address based on resolution', async () => {
		mockNearResolver.latestNonce.mockResolvedValue({ status: 'ok', nonce: 9 });

		const resultNonce = await messagingKeyNonces.getAddressNonce('alice.near', NEAR);

		expect(mockMessagingKeysApi.getProtocolAddressNonce).toHaveBeenCalledWith('alice.near', NEAR);
		expect(mockEthereumResolver.latestNonce).not.toHaveBeenCalled();
		expect(mockNearResolver.latestNonce).toHaveBeenCalled();
		expect(resultNonce).toEqual(9);
	});

	it('should throw error when resolutions fails', async () => {
		mockEthereumResolver.latestNonce.mockResolvedValue({ status: 'error', cause: new Error() });

		expect(() => messagingKeyNonces.getAddressNonce('0x1337', ETHEREUM)).rejects.toThrow();
	});
});
