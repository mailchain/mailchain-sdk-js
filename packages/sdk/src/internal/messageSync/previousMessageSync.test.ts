import { secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { encodeHexZeroX } from '@mailchain/encoding';
import {
	Address,
	IdentityKeysApiInterface,
	MessagingKeysApiInterface,
	PrivateKey,
	ApiKeyConvert,
} from '@mailchain/api';
import { AxiosResponse } from 'axios';
import { MockProxy, mock } from 'jest-mock-extended';
import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ETHEREUM } from '@mailchain/addressing';
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

	let mockIdentityKeysApi: MockProxy<IdentityKeysApiInterface>;
	let mockMessagingKeysApi: MockProxy<MessagingKeysApiInterface>;
	let mockMessageSync: MockProxy<MessageSync>;

	let previousMessageSync: PreviousMessageSync;

	beforeEach(() => {
		mockIdentityKeysApi = mock();
		mockMessagingKeysApi = mock();
		mockMessageSync = mock();
		previousMessageSync = new PreviousMessageSync(
			mockIdentityKeysApi,
			() => mockMessagingKeysApi,
			keyRing,
			mockMessageSync,
		);
	});

	it('should get previous delivered messages and sync them', async () => {
		mockIdentityKeysApi.getIdentityKeyAddresses.mockResolvedValue({
			data: {
				addresses: [mockAddress1, mockAddress2],
			},
		} as AxiosResponse);
		mockMessagingKeysApi.getPrivateMessagingKey
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
			status: 'ok',
			mailbox: AliceWalletMailbox,
			messages: [{ messageId: 'messageId' } as any],
		};
		mockMessageSync.syncWithMessagingKey.mockResolvedValue(mockSyncResult);

		const syncRes = await previousMessageSync.sync(AliceWalletMailbox);

		expect(syncRes).toEqual([
			{ ...mockSyncResult, address: mockAddress1 },
			{ ...mockSyncResult, address: mockAddress2 },
		]);
		const firstSync = mockMessageSync.syncWithMessagingKey.mock.calls[0];
		expect(firstSync[0]).toEqual(AliceWalletMailbox);
		expect(firstSync[1].publicKey).toEqual(ApiKeyConvert.private(mockPrivateMessagingKey1).publicKey);
		const secondSync = mockMessageSync.syncWithMessagingKey.mock.calls[1];
		expect(secondSync[0]).toEqual(AliceWalletMailbox);
		expect(secondSync[1].publicKey).toEqual(ApiKeyConvert.private(mockPrivateMessagingKey2).publicKey);
		expect(mockIdentityKeysApi.getIdentityKeyAddresses).toBeCalledWith(
			encodeHexZeroX(encodePublicKey(AliceWalletMailbox.identityKey)),
		);
	});
});
