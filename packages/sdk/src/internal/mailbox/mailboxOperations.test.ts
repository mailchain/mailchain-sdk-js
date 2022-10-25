import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { encodePublicKey, KindNaClSecretKey } from '@mailchain/crypto';
import { decodeBase64, encodeBase64, encodeHex, EncodingTypes } from '@mailchain/encoding';
import { mock } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { formatAddress, parseNameServiceAddress } from '@mailchain/addressing';
import { sha256 } from '@noble/hashes/sha256';
import * as protoInbox from '../protobuf/inbox/inbox';
import { createMimeMessage } from '../formatters/generate';
import { Payload } from '../transport/payload/content/payload';
import {
	GetMessageResponseBody,
	GetMessagesInViewResponseBody,
	InboxApi,
	PostPayloadResponseBody,
	PutEncryptedMessageRequestBodyFolderEnum,
} from '../api';
import { AliceAccountMailbox, AliceWalletMailbox } from '../user/test.const';
import { dummyMailData } from '../test.const';
import { MailboxOperations, MailchainMailboxOperations } from './mailboxOperations';
import { createMailchainMessageCrypto } from './messageCrypto';
import { AddressesHasher } from './addressHasher';
import { createMailchainMessageIdCreator } from './messageId';
import { UserMailboxHasher } from './userMailboxHasher';
import { AddressMatch, MessageMailboxOwnerMatcher } from './messageMailboxOwnerMatcher';
import { MessagePreviewMigrationRule } from './migrations';

describe('mailbox', () => {
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const messagePreviewCrypto = keyRing.inboxKey();
	const messageCrypto = createMailchainMessageCrypto(keyRing);

	const mockAddressHasher: AddressesHasher = (addresses) =>
		Promise.resolve(
			addresses.reduce((result, address) => {
				result.set(address, [
					{ type: 'identity-key', hash: Buffer.from(address) },
					{ type: 'username', hash: Buffer.from(address) },
				]);
				return result;
			}, new Map()),
		);
	const mockUserMailboxHasher: UserMailboxHasher = (mailbox) => Promise.resolve(sha256(mailbox.identityKey.bytes));
	const inboxApi = mock<InboxApi>();
	const mockOwnerMatcher = mock<MessageMailboxOwnerMatcher>();
	let payload: Payload;

	const msg1Preview = protoInbox.preview.MessagePreview.create({
		from: 'Bob',
		subject: 'Hey Alice!',
		owner: 'ownerAddress',
		mailbox: encodePublicKey(AliceAccountMailbox.identityKey),
		snippet: 'Message from Bob to Alice',
		hasAttachment: true,
		timestamp: 1653991533,
		to: ['0x4321@ethereum.mailchain.local', '0xabcd@ethereum.mailchain.local'],
	});
	const msg2Preview = { ...msg1Preview, snippet: 'Another message from Bob to Alice' };

	const dummyMigration: MessagePreviewMigrationRule = {
		shouldApply: ({ version }) => Promise.resolve(version === 1),
		apply: (data) =>
			Promise.resolve({
				messagePreview: data.messagePreview,
				version: 2,
			}),
	};

	let mailboxOperations: MailboxOperations;

	const dateOffset = 999;
	beforeEach(() => {
		jest.resetAllMocks();

		mockOwnerMatcher.withMessageIdentityKeys.mockReturnValue(mockOwnerMatcher);
		mailboxOperations = new MailchainMailboxOperations(
			inboxApi,
			messagePreviewCrypto,
			messageCrypto,
			mockOwnerMatcher,
			mockAddressHasher,
			createMailchainMessageIdCreator(keyRing),
			mockUserMailboxHasher,
			dateOffset,
			dummyMigration,
		);
	});

	beforeAll(async () => {
		payload = {
			Headers: {
				Origin: keyRing.accountMessagingKey().publicKey,
				ContentSignature: new Uint8Array([1, 3, 3, 7]),
				Created: new Date('06/14/2022'),
				ContentLength: 1337,
				ContentType: 'message/x.mailchain',
				ContentEncoding: EncodingTypes.Base64,
				ContentEncryption: KindNaClSecretKey,
			},
			Content: Buffer.from((await createMimeMessage(dummyMailData, new Map())).original),
		};
	});

	it('should return message preview for message', async () => {
		const msg1EncryptedPreview = await messagePreviewCrypto.encrypt(
			protoInbox.preview.MessagePreview.encode(msg1Preview).finish(),
		);
		inboxApi.getMessage.mockResolvedValue({
			data: {
				message: {
					messageId: encodeHex(Uint8Array.from([1])),
					encryptedPreview: encodeBase64(msg1EncryptedPreview),
					systemLabels: ['inbox', 'unread'],
				},
			},
		} as AxiosResponse<GetMessageResponseBody>);

		const message = await mailboxOperations.getMessage('messageId');

		expect(inboxApi.getMessage.mock.calls[0][0]).toEqual('messageId');
		expect(message).toEqual({
			...msg1Preview,
			mailbox: AliceAccountMailbox.identityKey,
			messageId: encodeHex(Uint8Array.from([1])),
			isRead: false,
			timestamp: new Date(msg1Preview.timestamp * 1000),
			systemLabels: ['inbox', 'unread'],
		});
	});

	const messageViewsTests = [
		['getInboxMessages', 'getMessagesInInboxView'],
		['getArchivedMessages', 'getMessagesInArchivedView'],
		['getStarredMessages', 'getMessagesInStarredView'],
		['getTrashMessages', 'getMessagesInTrashView'],
		['getUnreadMessages', 'getMessagesInUnreadView'],
		['getSentMessages', 'getMessagesInSentView'],
		['searchMessages', 'getMessagesSearch'],
	] as const;

	test.each(messageViewsTests)(
		'should return correct messages for %p using %p api method',
		async (mailboxMethod, apiMethod) => {
			// Given
			const msg1EncryptedPreview = await messagePreviewCrypto.encrypt(
				protoInbox.preview.MessagePreview.encode(msg1Preview).finish(),
			);
			const msg2EncryptedPreview = await messagePreviewCrypto.encrypt(
				protoInbox.preview.MessagePreview.encode(msg2Preview).finish(),
			);
			inboxApi[apiMethod].mockResolvedValue({
				data: {
					messages: [
						{
							messageId: encodeHex(Uint8Array.from([1])),
							encryptedPreview: encodeBase64(msg1EncryptedPreview),
							systemLabels: ['starred'],
						},
						{
							messageId: encodeHex(Uint8Array.from([2])),
							encryptedPreview: encodeBase64(msg2EncryptedPreview),
							systemLabels: ['starred'],
						},
					],
				},
			} as AxiosResponse<GetMessagesInViewResponseBody>);

			// When
			const messages = await mailboxOperations[mailboxMethod]();

			// Then
			expect(inboxApi[apiMethod].mock.calls).toHaveLength(1);
			expect(messages).toEqual(
				[msg1Preview, msg2Preview].map((msg, index) => ({
					...msg,
					mailbox: AliceAccountMailbox.identityKey,
					messageId: encodeHex(Uint8Array.from([index + 1])),
					isRead: true,
					timestamp: new Date(msg.timestamp * 1000),
					systemLabels: ['starred'],
					to: ['0x4321@ethereum.mailchain.local', '0xabcd@ethereum.mailchain.local'],
				})),
			);
		},
	);

	it('should decrypt full message body', async () => {
		const encryptedPayload = await messageCrypto.encrypt(payload);
		inboxApi.getEncryptedMessageBody.mockResolvedValue({ data: encryptedPayload } as AxiosResponse<object>);

		const message = await mailboxOperations.getFullMessage('messageId');

		expect(message.from).toEqual(dummyMailData.from.address);
		expect(message.replyTo).toEqual(dummyMailData.replyTo?.address);
		expect(message.to).toEqual(dummyMailData.recipients.map((r) => r.address));
		expect(message.cc).toEqual(dummyMailData.carbonCopyRecipients.map((r) => r.address));
		expect(message.bcc).toEqual(dummyMailData.blindCarbonCopyRecipients.map((r) => r.address));
		expect(message.timestamp).toEqual(payload.Headers.Created);
		expect(message.body).toMatchSnapshot('fullMessageBody');
	});

	it('should encrypt and post sent message', async () => {
		const uri = 'messageBodyUri';
		const resourceId = 'resourceId';
		inboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { uri, resourceId },
		} as AxiosResponse<PostPayloadResponseBody>);
		inboxApi.putEncryptedMessage.mockResolvedValue({ data: undefined } as AxiosResponse<void>);

		const message = await mailboxOperations.saveSentMessage({
			userMailbox: AliceAccountMailbox,
			payload,
			content: dummyMailData,
		});

		expect(message.messageId).toMatchSnapshot('sent message id');
		expect(inboxApi.putEncryptedMessage.mock.calls[0][0]).toEqual(message.messageId);
		const requestBody = inboxApi.putEncryptedMessage.mock.calls[0][1];
		const decryptedPreview = protoInbox.preview.MessagePreview.decode(
			await messagePreviewCrypto.decrypt(decodeBase64(requestBody.encryptedPreview)),
		);

		expect(decryptedPreview).toEqual({
			owner: formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
			mailbox: encodePublicKey(AliceAccountMailbox.identityKey),
			from: dummyMailData.from.address,
			hasAttachment: false,
			snippet:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore',
			subject: dummyMailData.subject,
			timestamp: payload.Headers.Created.getTime() / 1000,
			to: dummyMailData.recipients.map((r) => r.address),
			cc: dummyMailData.carbonCopyRecipients.map((r) => r.address),
			bcc: dummyMailData.blindCarbonCopyRecipients.map((r) => r.address),
		});
		expect(requestBody.version).toEqual(3);
		expect(requestBody.date + dateOffset).toEqual(payload.Headers.Created.getTime() / 1000);
		expect(requestBody.folder).toEqual(PutEncryptedMessageRequestBodyFolderEnum.Outbox);
		expect(requestBody.messageBodyResourceId).toEqual(resourceId);
		expect(requestBody.hashedOwner).toMatchSnapshot('hashedOwner');
		expect(requestBody.hashedFrom).toMatchSnapshot('hashedFrom');
		expect(requestBody.hashedTo).toMatchSnapshot('hashedTo');
		expect(requestBody.mailbox).toEqual(Array.from(sha256(AliceAccountMailbox.identityKey.bytes)));
		expect(await messageCrypto.decrypt(inboxApi.postEncryptedMessageBody.mock.calls[0][0] as Uint8Array)).toEqual(
			payload,
		);
	});

	it('should encrypt and post received message', async () => {
		const matchedOwners: AddressMatch[] = [
			{ matchBy: 'message-header', address: parseNameServiceAddress(dummyMailData.recipients[0].address) },
			{
				matchBy: 'mailchain-api',
				address: parseNameServiceAddress(dummyMailData.carbonCopyRecipients[0].address),
			},
		];
		mockOwnerMatcher.findMatches.mockResolvedValue(matchedOwners);
		const uri = 'messageBodyUri';
		const resourceId = 'resourceId';
		inboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { uri, resourceId },
		} as AxiosResponse<PostPayloadResponseBody>);
		inboxApi.putEncryptedMessage.mockResolvedValue({ data: undefined } as AxiosResponse<void>);

		const messages = await mailboxOperations.saveReceivedMessage({
			payload,
			userMailbox: AliceWalletMailbox,
		});

		expect(messages).toHaveLength(matchedOwners.length);
		expect(inboxApi.putEncryptedMessage).toHaveBeenCalledTimes(matchedOwners.length);

		for (let index = 0; index < matchedOwners.length; index++) {
			const { address: matchedOwner } = matchedOwners[index];
			expect(messages[index]).toMatchSnapshot(`message id ${formatAddress(matchedOwner, 'mail')}`);
			expect(inboxApi.putEncryptedMessage.mock.calls[index][0]).toEqual(messages[index].messageId);
			const requestBody = inboxApi.putEncryptedMessage.mock.calls[index][1];
			const decryptedPreview = protoInbox.preview.MessagePreview.decode(
				await messagePreviewCrypto.decrypt(decodeBase64(requestBody.encryptedPreview)),
			);

			expect(decryptedPreview).toEqual({
				from: dummyMailData.from.address,
				owner: formatAddress(matchedOwner, 'mail'),
				mailbox: encodePublicKey(AliceWalletMailbox.identityKey),
				hasAttachment: false,
				snippet:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore',
				subject: dummyMailData.subject,
				timestamp: payload.Headers.Created.getTime() / 1000,
				to: dummyMailData.recipients.map((r) => r.address),
				cc: dummyMailData.carbonCopyRecipients.map((r) => r.address),
				bcc: dummyMailData.blindCarbonCopyRecipients.map((r) => r.address),
			});
			expect(requestBody.version).toEqual(3);
			expect(requestBody.mailbox).toEqual(Array.from(sha256(AliceWalletMailbox.identityKey.bytes)));
			expect(requestBody.date + dateOffset).toEqual(payload.Headers.Created.getTime() / 1000);
			expect(requestBody.folder).toEqual(PutEncryptedMessageRequestBodyFolderEnum.Inbox);
			expect(requestBody.messageBodyResourceId).toEqual(resourceId);
			expect(requestBody.hashedOwner).toMatchSnapshot('hashedOwner');
			expect(requestBody.hashedFrom).toMatchSnapshot('hashedFrom');
			expect(requestBody.hashedTo).toMatchSnapshot('hashedTo');
			expect(
				await messageCrypto.decrypt(inboxApi.postEncryptedMessageBody.mock.calls[0][0] as Uint8Array),
			).toEqual(payload);
		}
	});

	const labelsTests = [
		['modifyArchiveMessage', 'archive', true],
		['modifyIsReadMessage', 'unread', false],
		['modifyTrashMessage', 'trash', true],
		['modifyStarredMessage', 'starred', true],
		['modifyUserLabel', 'user-label', true],
	] as const;

	describe.each(labelsTests)('%s', (method, label, shouldPut) => {
		it(`should put ${label} when ${method} is invoked with ${shouldPut}`, async () => {
			if (method === 'modifyUserLabel') {
				await mailboxOperations[method]('messageId', label, shouldPut);
			} else {
				await mailboxOperations[method]('messageId', shouldPut);
			}

			const apiCall = inboxApi.putMessageLabel.mock.calls[0];
			expect(apiCall[0]).toEqual('messageId');
			expect(apiCall[1]).toEqual(label);
		});

		it(`should delete ${label} when ${method} is invoked with ${!shouldPut}`, async () => {
			if (method === 'modifyUserLabel') {
				await mailboxOperations[method]('messageId', label, !shouldPut);
			} else {
				await mailboxOperations[method]('messageId', !shouldPut);
			}

			const apiCall = inboxApi.deleteMessageLabel.mock.calls[0];
			expect(apiCall[0]).toEqual('messageId');
			expect(apiCall[1]).toEqual(label);
		});
	});
});
