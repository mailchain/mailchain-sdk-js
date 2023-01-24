import { ETHEREUM } from '@mailchain/addressing/protocols';
import { AxiosError } from 'axios';
import { MessagingKeyNonces } from './addressNonce';

describe('getAddressNonce', () => {
	const mockIdentityKeysApi = { getIdentityKey: jest.fn() };
	const mockMessagingKeysApi = { getIdentityKeyNonce: jest.fn() };

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mock('@mailchain/api', () => ({
			IdentityKeysApiFactory: jest.fn(() => 'tote'),
			MessagingKeysApiFactory: jest.fn(() => 'mote'),
		}));
	});

	it('should return nonce of 0 when no identity-key is found', async () => {
		mockIdentityKeysApi.getIdentityKey.mockReturnValue(
			Promise.reject({ isAxiosError: true, response: { status: 404 } } as AxiosError),
		);

		const target = new MessagingKeyNonces(mockMessagingKeysApi as any, mockIdentityKeysApi as any);
		const resultNonce = await target.getAddressNonce('0x1337', ETHEREUM);

		expect(mockIdentityKeysApi.getIdentityKey.mock.calls[0][0]).toEqual('0x1337');
		expect(mockIdentityKeysApi.getIdentityKey.mock.calls[0][1]).toEqual(ETHEREUM);
		expect(mockMessagingKeysApi.getIdentityKeyNonce.mock.calls).toHaveLength(0);
		expect(resultNonce).toEqual(0);
	});

	it('should return nonce based on the returned identity key', async () => {
		mockIdentityKeysApi.getIdentityKey.mockReturnValue(Promise.resolve({ data: { identityKey: '0xIdentityKey' } }));
		mockMessagingKeysApi.getIdentityKeyNonce.mockReturnValue(Promise.resolve({ data: { nonce: 9 } }));

		const target = new MessagingKeyNonces(mockMessagingKeysApi as any, mockIdentityKeysApi as any);
		const resultNonce = await target.getAddressNonce('0x1337', ETHEREUM);

		expect(mockMessagingKeysApi.getIdentityKeyNonce.mock.calls[0][0]).toEqual('0xIdentityKey');
		expect(resultNonce).toEqual(9);
	});

	it('should throw error when unexpected error appears', async () => {
		mockIdentityKeysApi.getIdentityKey.mockReturnValue(Promise.reject(new Error('unexpected error')));

		const target = new MessagingKeyNonces(mockMessagingKeysApi as any, mockIdentityKeysApi as any);
		await expect(target.getAddressNonce('0x1337', ETHEREUM)).rejects.toThrow();
	});
});