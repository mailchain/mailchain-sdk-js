import { secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { encodeHexZeroX } from '@mailchain/encoding';
import { Address, MessagingKeysApiInterface, PrivateKey, ApiKeyConvert } from '@mailchain/api';
import { AxiosResponse } from 'axios';
import { mock } from 'jest-mock-extended';
import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM } from '@mailchain/addressing';
import { IdentityKeys } from '../identityKeys';
import { AliceWalletMailbox, BobWalletMailbox } from '../user/test.const';
import { PreviousMessageSync } from './previousMessageSync';
import { MessageSync, SyncResult } from './messageSync';

describe('PreviousMessageSync', () => {
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

	const mockAddress1 = {
		encoding: 'hex/0x-prefix',
		network: 'main',
		protocol: ETHEREUM,
		value: AliceWalletMailbox.aliases[0].address.username,
	} as Address;
	const mockPrivateMessagingKey1 = {
		curve: 'ed25519',
		encoding: 'hex/0x-prefix',
		value: encodeHexZeroX(ED25519PrivateKey.fromSeed(secureRandom(32)).bytes),
	} as PrivateKey;

	const mockAddress2 = {
		encoding: 'hex/0x-prefix',
		network: 'bnb',
		protocol: ETHEREUM,
		value: BobWalletMailbox.aliases[0].address.username,
	} as Address;
	const mockPrivateMessagingKey2 = {
		curve: 'ed25519',
		encoding: 'hex/0x-prefix',
		value: encodeHexZeroX(ED25519PrivateKey.fromSeed(secureRandom(32)).bytes),
	} as PrivateKey;

	const mockIdentityKeys = mock<IdentityKeys>();
	const mockMessagingKeysApi = mock<MessagingKeysApiInterface>();
	const mockMessageSync = mock<MessageSync>();

	let previousMessageSync: PreviousMessageSync;

	beforeEach(() => {
		jest.clearAllMocks();

		previousMessageSync = new PreviousMessageSync(
			mockIdentityKeys,
			() => mockMessagingKeysApi,
			keyRing,
			mockMessageSync,
		);
	});

	it('should get previous delivered messages and sync them', async () => {
		mockIdentityKeys.reverse.mockResolvedValue([mockAddress1, mockAddress2]);
		mockMessagingKeysApi.getVendedPrivateMessagingKey
			.mockResolvedValueOnce({
				data: {
					privateKey: mockPrivateMessagingKey1,
				},
			} as AxiosResponse)
			.mockResolvedValueOnce({
				data: {
					privateKey: mockPrivateMessagingKey2,
				},
			} as AxiosResponse);
		const mockSyncResult: SyncResult = {
			status: 'success',
			mailbox: AliceWalletMailbox,
			messages: [{ messageId: 'messageId' } as any],
		};
		mockMessageSync.syncWithMessagingKey.mockResolvedValue(mockSyncResult);

		const syncRes = await previousMessageSync.sync(AliceWalletMailbox);

		expect(syncRes).toEqual([
			{ ...mockSyncResult, address: { address: mockAddress1.value, protocol: mockAddress1.protocol } },
			{ ...mockSyncResult, address: { address: mockAddress2.value, protocol: mockAddress2.protocol } },
		]);
		const firstSync = mockMessageSync.syncWithMessagingKey.mock.calls[0];
		expect(firstSync[0]).toEqual(AliceWalletMailbox);
		expect(firstSync[1].publicKey).toEqual(ApiKeyConvert.private(mockPrivateMessagingKey1).publicKey);
		const secondSync = mockMessageSync.syncWithMessagingKey.mock.calls[1];
		expect(secondSync[0]).toEqual(AliceWalletMailbox);
		expect(secondSync[1].publicKey).toEqual(ApiKeyConvert.private(mockPrivateMessagingKey2).publicKey);
		expect(mockIdentityKeys.reverse).toBeCalledWith(AliceWalletMailbox.identityKey);
	});
});
