import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { MailData } from '@mailchain/sdk/internal/formatters/types';
import { createMailchainMessageIdCreator } from './messageId';

describe('mailbox message id', () => {
	it('should create unique id for sent messages', async () => {
		const aliceHasher = createMailchainMessageIdCreator(KeyRing.fromPrivateKey(AliceED25519PrivateKey));
		const bobHasher = createMailchainMessageIdCreator(KeyRing.fromPrivateKey(BobED25519PrivateKey));

		const aliceHash = await aliceHasher({
			mailData: { id: '123@mailchain.local' } as MailData,
			type: 'sent',
		});
		const bobHash = await bobHasher({ mailData: { id: '123@mailchain.local' } as MailData, type: 'sent' });

		expect(aliceHash).not.toEqual(bobHash);
		expect(aliceHash).toMatchSnapshot('aliceSentHash');
		expect(bobHash).toMatchSnapshot('bobSentHash');
	});

	it('should create unique id for received messages', async () => {
		const aliceHasher = createMailchainMessageIdCreator(KeyRing.fromPrivateKey(AliceED25519PrivateKey));

		const recipientHash1 = await aliceHasher({
			mailData: { id: '123@mailchain.local' } as MailData,
			type: 'received',
			owner: '0x4321@ethereum.mailchain.local',
		});
		const recipientHash2 = await aliceHasher({
			mailData: { id: '123@mailchain.local' } as MailData,
			type: 'received',
			owner: '0x1234@ethereum.mailchain.local',
		});

		expect(recipientHash1).not.toEqual(recipientHash2);
		expect(recipientHash1).toMatchSnapshot('recipientHash1');
		expect(recipientHash2).toMatchSnapshot('recipientHash2');
	});
});
