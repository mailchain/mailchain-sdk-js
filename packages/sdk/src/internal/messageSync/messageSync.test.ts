import { secureRandom } from '@mailchain/crypto';
import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { mock, MockProxy } from 'jest-mock-extended';
import { TestSdkConfig } from '../test.const';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { Payload } from '../transport';
import { MailboxOperations, MessagePreview } from '../mailbox';
import { MailReceiver, ReceivedMailOk } from '../receiving/mail';
import { MessageSync } from './messageSync';

describe('MessageSync', () => {
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	let aliceAccountMailReceiver: MockProxy<MailReceiver>;
	let aliceWalletMailReceiver: MockProxy<MailReceiver>;
	let mockMailboxOperations: MockProxy<MailboxOperations>;

	let messageSync: MessageSync;

	beforeEach(() => {
		mockMailboxOperations = mock();
		aliceAccountMailReceiver = mock();
		aliceWalletMailReceiver = mock();
		const mockMailReceiverFactory = (_, decrypter: KeyRingDecrypter) => {
			if (decrypter.publicKey === keyRing.accountMessagingKey().publicKey) return aliceAccountMailReceiver;
			return aliceWalletMailReceiver;
		};

		messageSync = new MessageSync(TestSdkConfig, mockMailReceiverFactory, keyRing, mockMailboxOperations);
	});

	it('should sync multiple recipients', async () => {
		const mockSyncMailbox = jest.spyOn(messageSync as any, 'syncMailbox');
		mockSyncMailbox
			.mockResolvedValueOnce({ type: 'success', mailbox: AliceAccountMailbox, messages: [] })
			.mockRejectedValueOnce(new Error('expected'));

		const syncRes = await messageSync.sync([AliceAccountMailbox, AliceWalletMailbox]);

		expect(syncRes[0]).toEqual({ type: 'success', mailbox: AliceAccountMailbox, messages: [] });
		expect(syncRes[1]).toEqual({ type: 'fail', mailbox: AliceWalletMailbox, cause: new Error('expected') });
		expect(mockSyncMailbox).toHaveBeenCalledTimes(2);
	});

	it('should sync recipient', async () => {
		const undeliveredMessages: ReceivedMailOk[] = [
			{
				payload: { Headers: { ContentSignature: secureRandom() } } as Payload,
				deliveryRequestHash: Uint8Array.from([0x01]),
				status: 'ok',
			},
			{
				payload: { Headers: { ContentSignature: secureRandom() } } as Payload,
				deliveryRequestHash: Uint8Array.from([0x02]),
				status: 'ok',
			},
		];
		aliceAccountMailReceiver.confirmDelivery.mockResolvedValue();
		aliceAccountMailReceiver.getUndelivered.mockResolvedValue(undeliveredMessages);
		const dummyMessages: [MessagePreview, ...MessagePreview[]][] = [
			[{ messageId: 'message-id-1-1' } as MessagePreview, { messageId: 'message-id-1-2' } as MessagePreview],
			[
				{ messageId: 'message-id-2-1' } as MessagePreview,
				{ messageId: 'message-id-2-2' } as MessagePreview,
				{ messageId: 'message-id-2-3' } as MessagePreview,
			],
		];
		mockMailboxOperations.saveReceivedMessage
			.mockResolvedValueOnce(dummyMessages[0])
			.mockResolvedValueOnce(dummyMessages[1]);

		const syncRes = await messageSync['syncMailbox'](AliceAccountMailbox);

		expect(syncRes).toEqual({
			type: 'success',
			mailbox: AliceAccountMailbox,
			messages: dummyMessages.flatMap((m) => m),
		});
		expect(aliceAccountMailReceiver.getUndelivered).toHaveBeenCalledTimes(1);
		expect(mockMailboxOperations.saveReceivedMessage).toHaveBeenNthCalledWith(1, {
			payload: undeliveredMessages[0].payload,
			userMailbox: AliceAccountMailbox,
		});
		expect(mockMailboxOperations.saveReceivedMessage).toHaveBeenNthCalledWith(2, {
			payload: undeliveredMessages[1].payload,
			userMailbox: AliceAccountMailbox,
		});

		const firstConfirmation = aliceAccountMailReceiver.confirmDelivery.mock.calls[0];
		expect(firstConfirmation[0]).toEqual(Uint8Array.from([0x01]));
		const secondConfirmation = aliceAccountMailReceiver.confirmDelivery.mock.calls[1];
		expect(secondConfirmation[0]).toEqual(Uint8Array.from([0x02]));
	});
});
