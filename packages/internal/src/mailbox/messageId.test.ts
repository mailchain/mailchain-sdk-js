import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { dummyMailData } from '../test.const';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { createMailchainMessageIdCreator } from './messageId';

describe('mailbox message id', () => {
	it('should create unique id for sent messages', async () => {
		const aliceHasher = createMailchainMessageIdCreator(aliceKeyRing);
		const bobHasher = createMailchainMessageIdCreator(bobKeyRing);

		const aliceHash = await aliceHasher({ mailData: dummyMailData, type: 'sent' });
		const bobHash = await bobHasher({ mailData: dummyMailData, type: 'sent' });

		expect(aliceHash).not.toEqual(bobHash);
		expect(aliceHash).toEqual('8abcfc68fff062b5776787aee9a56f0d6ba84c5c8e7a977309825b76fbe86116');
		expect(bobHash).toEqual('b9e4fe2aa856a80756b5644de214b1ca44ccf15031c15b2a7aadd64b7404a7e0');
	});

	it('should create unique id for received messages', async () => {
		const aliceHasher = createMailchainMessageIdCreator(aliceKeyRing);
		const bobHasher = createMailchainMessageIdCreator(bobKeyRing);

		const hash = await aliceHasher({
			mailData: dummyMailData,
			type: 'received',
			mailbox: AliceAccountMailbox.identityKey,
			owner: '0x4321@ethereum.mailchain.local',
		});
		const differentKeyRing = await bobHasher({
			mailData: dummyMailData,
			type: 'received',
			mailbox: AliceAccountMailbox.identityKey,
			owner: '0x4321@ethereum.mailchain.local',
		});
		const differentOwner = await aliceHasher({
			mailData: dummyMailData,
			type: 'received',
			mailbox: AliceAccountMailbox.identityKey,
			owner: '0x1234@ethereum.mailchain.local',
		});
		const differentMailbox = await aliceHasher({
			mailData: dummyMailData,
			type: 'received',
			mailbox: AliceWalletMailbox.identityKey,
			owner: '0x1234@ethereum.mailchain.local',
		});

		expect(hash).not.toEqual(differentKeyRing);
		expect(hash).not.toEqual(differentOwner);
		expect(hash).not.toEqual(differentMailbox);
		expect(differentOwner).not.toEqual(differentMailbox);
		expect(differentKeyRing).toEqual('cc2ce8fe9cb7f6d4cd77e9e1c94a220106b556321811a9e2a5ca2c8a5646c216');
		expect(hash).toEqual('2305a049004b9a275a3e26a913b073b90ebb7d7c459e800b7c1608ec1de44416');
		expect(differentOwner).toEqual('26595daac6f93b91fd0e3ee5e33e11408c2959863f163b301defe963607e35fa');
		expect(differentMailbox).toEqual('90658b05b7ad81e59c6a86d8ba035700fc1283132fe65778591e22a26ed0a09a');
	});
});
