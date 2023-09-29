import { formatAddress, parseNameServiceAddress } from '@mailchain/addressing';
import {
	GetMailboxOverviewResponseBody,
	GetMessageResponseBody,
	GetMessagesInViewResponseBody,
	InboxApi,
	PostPayloadResponseBody,
	PutEncryptedMessageRequestBodyFolderEnum,
} from '@mailchain/api';
import { KindNaClSecretKey, publicKeyToBytes } from '@mailchain/crypto';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { EncodingTypes, decodeBase64, encodeBase64, encodeHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { sha256 } from '@noble/hashes/sha256';
import { AxiosResponse } from 'axios';
import { mock } from 'jest-mock-extended';
import { createMimeMessage } from '../formatters/generate';
import { MailboxRuleEngine } from '../mailboxRuleEngine';
import * as protoInbox from '../protobuf/inbox/inbox';
import { dummyMailData } from '../test.const';
import { Payload } from '../transport';
import { AliceAccountMailbox, AliceWalletMailbox, BobAccountMailbox } from '../user/test.const';
import { AddressesHasher } from './addressHasher';
import { MailboxOperations, MailchainMailboxOperations } from './mailboxOperations';
import { createMailchainMessageCrypto } from './messageCrypto';
import { createMailchainMessageIdCreator } from './messageId';
import { AddressMatch, MessageMailboxOwnerMatcher } from './messageMailboxOwnerMatcher';
import { MessagePreviewMigrationRule } from './migrations';
import { SystemMessageLabel } from './types';
import { UserMailboxHasher } from './userMailboxHasher';

describe('mailbox', () => {
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const messagePreviewCrypto = keyRing.inboxKey();
	const messageCrypto = createMailchainMessageCrypto(keyRing);
	const mockRuleEngine = mock<MailboxRuleEngine>();

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
	const mockInboxApi = mock<InboxApi>();
	const mockOwnerMatcher = mock<MessageMailboxOwnerMatcher>();
	let payload: Payload;

	const msg1Preview = protoInbox.preview.MessagePreview.create({
		from: 'Bob',
		subject: 'Hey Alice!',
		owner: 'ownerAddress',
		mailbox: publicKeyToBytes(AliceAccountMailbox.identityKey),
		snippet: 'Message from Bob to Alice',
		hasAttachment: true,
		timestamp: new Date('2022-6-6').getTime() / 1000,
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
		jest.clearAllMocks();

		mockRuleEngine.apply.mockImplementation((params) => {
			return Promise.resolve({
				...params,
				message: {
					...params.message,
					systemLabels: [...params.message.systemLabels, 'rule-engine' as SystemMessageLabel],
				},
			});
		});

		mockOwnerMatcher.withMessageIdentityKeys.mockReturnValue(mockOwnerMatcher);
		mailboxOperations = new MailchainMailboxOperations(
			mockInboxApi,
			messagePreviewCrypto,
			messageCrypto,
			mockOwnerMatcher,
			mockAddressHasher,
			createMailchainMessageIdCreator(keyRing),
			mockUserMailboxHasher,
			dateOffset,
			dummyMigration,
			mockRuleEngine,
		);
	});

	beforeAll(async () => {
		payload = {
			Headers: {
				Origin: keyRing.accountMessagingKey().publicKey,
				ContentSignature: new Uint8Array([1, 3, 3, 7]),
				Created: new Date('2022-6-14'),
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
		mockInboxApi.getMessage.mockResolvedValue({
			data: {
				message: {
					kind: 'mail',
					messageId: encodeHex(Uint8Array.from([1])),
					encryptedPreview: encodeBase64(msg1EncryptedPreview),
					systemLabels: ['inbox', 'unread'],
				},
			},
		} as AxiosResponse<GetMessageResponseBody>);

		const message = await mailboxOperations.getMessage('messageId');

		expect(mockInboxApi.getMessage.mock.calls[0][0]).toEqual('messageId');
		expect(message).toEqual({
			...msg1Preview,
			kind: 'mail',
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
		['getSpamMessages_unstable', 'getMessagesInSpamView'],
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
			mockInboxApi[apiMethod].mockResolvedValue({
				data: {
					messages: [
						{
							kind: 'mail',
							messageId: encodeHex(Uint8Array.from([1])),
							encryptedPreview: encodeBase64(msg1EncryptedPreview),
							systemLabels: ['starred'],
						},
						{
							kind: 'mail',
							messageId: encodeHex(Uint8Array.from([2])),
							encryptedPreview: encodeBase64(msg2EncryptedPreview),
							systemLabels: ['starred'],
						},
					],
				},
			} as AxiosResponse<GetMessagesInViewResponseBody>);

			// When
			const messages = await mailboxOperations[mailboxMethod]({
				offset: 10,
				limit: 20,
				userMailboxes: [AliceAccountMailbox],
			});

			// Then
			expect(mockInboxApi[apiMethod]).toHaveBeenCalledTimes(1);
			expect(mockInboxApi[apiMethod]).toHaveBeenCalledWith(undefined, undefined, undefined, 10, 20, [
				'e80f39fd4a3d65d4a6494125ee0ecf279024c8fdd4e670e225485c777349d5a9',
			]);
			expect(messages).toEqual(
				[msg1Preview, msg2Preview].map((msg, index) => ({
					...msg,
					kind: 'mail',
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
		mockInboxApi.getEncryptedMessageBody.mockResolvedValue({ data: encryptedPayload } as AxiosResponse<object>);

		const message = await mailboxOperations.getFullMessage('messageId');

		expect(message.replyTo).toEqual(dummyMailData.replyTo?.address);
		expect(message.body).toMatchSnapshot('fullMessageBody');
	});

	it('should encrypt and post sent message', async () => {
		const uri = 'messageBodyUri';
		const resourceId = 'resourceId';
		mockInboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { uri, resourceId },
		} as AxiosResponse<PostPayloadResponseBody>);
		mockInboxApi.putEncryptedMessage.mockResolvedValue({ data: undefined } as AxiosResponse<void>);

		const message = await mailboxOperations.saveSentMessage({
			userMailbox: AliceAccountMailbox,
			payload,
			content: dummyMailData,
		});

		expect(message.messageId).toMatchSnapshot('sent message id');
		expect(mockInboxApi.putEncryptedMessage.mock.calls[0][0]).toEqual(message.messageId);
		const requestBody = mockInboxApi.putEncryptedMessage.mock.calls[0][1];
		const decryptedPreview = protoInbox.preview.MessagePreview.decode(
			await messagePreviewCrypto.decrypt(decodeBase64(requestBody.encryptedPreview)),
		);

		expect(decryptedPreview).toEqual({
			owner: formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
			mailbox: publicKeyToBytes(AliceAccountMailbox.identityKey),
			from: dummyMailData.from.address,
			hasAttachment: false,
			snippet:
				'- Lorem ipsum dolor sit amet, consectetuer adipiscing elit. - Aliquam tincidunt mauris eu risus. -',
			subject: dummyMailData.subject,
			timestamp: payload.Headers.Created.getTime() / 1000,
			to: dummyMailData.recipients.map((r) => r.address),
			cc: dummyMailData.carbonCopyRecipients.map((r) => r.address),
			bcc: dummyMailData.blindCarbonCopyRecipients.map((r) => r.address),
		});
		expect(requestBody.kind).toEqual('mail');
		expect(requestBody.version).toEqual(3);
		expect(requestBody.date + dateOffset).toEqual(payload.Headers.Created.getTime() / 1000);
		expect(requestBody.folder).toEqual(PutEncryptedMessageRequestBodyFolderEnum.Outbox);
		expect(requestBody.messageBodyResourceId).toEqual(resourceId);
		expect(requestBody.hashedOwner).toMatchSnapshot('hashedOwner');
		expect(requestBody.hashedFrom).toMatchSnapshot('hashedFrom');
		expect(requestBody.hashedTo).toMatchSnapshot('hashedTo');
		expect(requestBody.mailbox).toEqual(Array.from(sha256(AliceAccountMailbox.identityKey.bytes)));
		expect(
			await messageCrypto.decrypt(mockInboxApi.postEncryptedMessageBody.mock.calls[0][0] as Uint8Array),
		).toEqual(payload);
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
		mockInboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { uri, resourceId },
		} as AxiosResponse<PostPayloadResponseBody>);
		mockInboxApi.putEncryptedMessage.mockResolvedValue({ data: undefined } as AxiosResponse<void>);

		const messages = await mailboxOperations.saveReceivedMessage({
			receivedTransportPayload: payload,
			userMailbox: AliceWalletMailbox,
		});

		expect(messages).toHaveLength(matchedOwners.length);
		expect(mockInboxApi.putEncryptedMessage).toHaveBeenCalledTimes(matchedOwners.length);
		expect(mockRuleEngine.apply).toHaveBeenCalledTimes(matchedOwners.length);

		for (let index = 0; index < matchedOwners.length; index++) {
			const { address: matchedOwner } = matchedOwners[index];
			expect(messages[index]).toMatchSnapshot(`message id ${formatAddress(matchedOwner, 'mail')}`);
			expect(mockInboxApi.putEncryptedMessage.mock.calls[index][0]).toEqual(messages[index].messageId);
			const requestBody = mockInboxApi.putEncryptedMessage.mock.calls[index][1];
			const decryptedPreview = protoInbox.preview.MessagePreview.decode(
				await messagePreviewCrypto.decrypt(decodeBase64(requestBody.encryptedPreview)),
			);

			expect(decryptedPreview).toEqual({
				from: dummyMailData.from.address,
				owner: formatAddress(matchedOwner, 'mail'),
				mailbox: publicKeyToBytes(AliceWalletMailbox.identityKey),
				hasAttachment: false,
				snippet:
					'- Lorem ipsum dolor sit amet, consectetuer adipiscing elit. - Aliquam tincidunt mauris eu risus. -',
				subject: dummyMailData.subject,
				timestamp: payload.Headers.Created.getTime() / 1000,
				to: dummyMailData.recipients.map((r) => r.address),
				cc: dummyMailData.carbonCopyRecipients.map((r) => r.address),
				bcc: dummyMailData.blindCarbonCopyRecipients.map((r) => r.address),
			});
			expect(requestBody.kind).toEqual('mail');
			expect(requestBody.version).toEqual(3);
			expect(requestBody.mailbox).toEqual(Array.from(sha256(AliceWalletMailbox.identityKey.bytes)));
			expect(requestBody.date + dateOffset).toEqual(payload.Headers.Created.getTime() / 1000);
			expect(requestBody.folder).toEqual(PutEncryptedMessageRequestBodyFolderEnum.Inbox);
			expect(requestBody.messageBodyResourceId).toEqual(resourceId);
			expect(requestBody.hashedOwner).toMatchSnapshot('hashedOwner');
			expect(requestBody.hashedFrom).toMatchSnapshot('hashedFrom');
			expect(requestBody.hashedTo).toMatchSnapshot('hashedTo');
			expect(
				await messageCrypto.decrypt(mockInboxApi.postEncryptedMessageBody.mock.calls[0][0] as Uint8Array),
			).toEqual(payload);
		}
	});

	it('should remove html tags from message snippet', async () => {
		mockOwnerMatcher.findMatches.mockResolvedValue([
			{ matchBy: 'message-header', address: parseNameServiceAddress(dummyMailData.recipients[0].address) },
		]);
		const uri = 'messageBodyUri';
		const resourceId = 'resourceId';
		mockInboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { uri, resourceId },
		} as AxiosResponse<PostPayloadResponseBody>);
		mockInboxApi.putEncryptedMessage.mockResolvedValue({ data: undefined } as AxiosResponse<void>);

		const payloadWithHtmlPlainText: Payload = {
			...payload,
			Content: Buffer.from(
				(await createMimeMessage({ ...dummyMailData, plainTextMessage: dummyMailData.message }, new Map()))
					.original,
			),
		};
		const messages = await mailboxOperations.saveReceivedMessage({
			receivedTransportPayload: payloadWithHtmlPlainText,
			userMailbox: AliceWalletMailbox,
		});

		expect(messages).toHaveLength(1);
		const message = messages[0];
		expect(message.snippet).toMatchInlineSnapshot(
			`"Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam tincidunt mauris eu risus. Vesti"`,
		);
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

			const apiCall = mockInboxApi.putMessageLabel.mock.calls[0];
			expect(apiCall[0]).toEqual('messageId');
			expect(apiCall[1]).toEqual(label);
		});

		it(`should delete ${label} when ${method} is invoked with ${!shouldPut}`, async () => {
			if (method === 'modifyUserLabel') {
				await mailboxOperations[method]('messageId', label, !shouldPut);
			} else {
				await mailboxOperations[method]('messageId', !shouldPut);
			}

			const apiCall = mockInboxApi.deleteMessageLabel.mock.calls[0];
			expect(apiCall[0]).toEqual('messageId');
			expect(apiCall[1]).toEqual(label);
		});
	});

	it('should compute messages overview', async () => {
		mockInboxApi.getMailboxOverview.mockResolvedValue({
			data: {
				mailboxes: [
					{
						labels: [
							{ label: 'inbox', total: 2, unread: 1 },
							{ label: 'starred', total: 3, unread: 2 },
							{ label: 'archived', total: 4, unread: 3 },
						],
						mailbox: encodeHex(await mockUserMailboxHasher(AliceAccountMailbox)),
					},
					{
						labels: [
							{ label: 'inbox', total: 3, unread: 0 },
							{ label: 'starred', total: 4, unread: 1 },
							{ label: 'sent', total: 5, unread: 0 },
						],
						mailbox: encodeHex(await mockUserMailboxHasher(AliceWalletMailbox)),
					},
				],
			},
		} as AxiosResponse<GetMailboxOverviewResponseBody>);

		const overview = await mailboxOperations.getMessagesOverview([
			AliceAccountMailbox,
			AliceWalletMailbox,
			BobAccountMailbox,
		]);

		expect(overview).toMatchSnapshot();
		expect(mockInboxApi.getMailboxOverview).toHaveBeenCalledWith([
			'e80f39fd4a3d65d4a6494125ee0ecf279024c8fdd4e670e225485c777349d5a9',
			'c35dd5d86b8f0170db2b082cef3bca93db9ed95c6c785d4a67cced08b773bcea',
			'd2c8b50395acebb32709406a1102c4aa25f2fefc57d0ed64f58239d1be1da701',
		]);
	});
});
