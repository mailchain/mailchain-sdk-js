import {
	InboxApiInterface,
	PutEncryptedMessageRequestBodyFolderEnum,
	Message as ApiMessagePreview,
	InboxApiFactory,
	AddressesApiFactory,
} from '@mailchain/sdk/internal/api';
import * as protoInbox from '@mailchain/sdk/internal/protobuf/inbox/inbox';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { parseMimeText } from '@mailchain/sdk/internal/formatters/parse';
import { InboxKey } from '@mailchain/keyring/functions';
import { MailData } from '@mailchain/sdk/internal/formatters/types';
import flatten from 'lodash/flatten';
import { getAxiosWithSigner } from '@mailchain/sdk/internal/auth/jwt';
import { KeyRing } from '@mailchain/keyring';
import { Payload } from '@mailchain/sdk/internal/transport/payload/content/payload';
import { Configuration } from '@mailchain/sdk';
import { createAxiosConfiguration } from '@mailchain/sdk/internal/axios/config';
import { AddressesHasher, mailchainAddressHasher } from './addressHasher';
import { createMailchainMessageIdCreator, MessageIdCreator } from './messageId';
import { createMailchainMessageCrypto, MessageCrypto } from './messageCrypto';
import { MessagePreview, UserMessageLabel, SystemMessageLabel, Message } from './types';

type SaveSentMessageParam = { payload: Payload; content: MailData };

type SaveReceivedMessageParam = { owner: string; payload: Payload };

export interface Mailbox {
	getMessage(messageId: string): Promise<MessagePreview>;

	getInboxMessages(): Promise<MessagePreview[]>;

	getStarredMessages(): Promise<MessagePreview[]>;

	getTrashMessages(): Promise<MessagePreview[]>;

	getUnreadMessages(): Promise<MessagePreview[]>;

	getSentMessages(): Promise<MessagePreview[]>;

	getOutboxMessages(): Promise<MessagePreview[]>;

	getArchivedMessages(): Promise<MessagePreview[]>;

	searchMessages(): Promise<MessagePreview[]>;

	getFullMessage(messageUri: string): Promise<Message>;

	saveSentMessage(message: SaveSentMessageParam): Promise<MessagePreview>;

	saveReceivedMessage(message: SaveReceivedMessageParam): Promise<MessagePreview>;

	markOutboxMessageAsSent(messageId: string): Promise<void>;

	modifyArchiveMessage(messageId: string, archived: boolean): Promise<void>;

	modifyIsReadMessage(messageId: string, isRead: boolean): Promise<void>;

	modifyTrashMessage(messageId: string, trash: boolean): Promise<void>;

	modifyStarredMessage(messageId: string, isStarred: boolean): Promise<void>;

	modifyUserLabel(messageId: string, userLabel: UserMessageLabel, include: boolean): Promise<void>;
}

export class MailchainMailbox implements Mailbox {
	constructor(
		private readonly inboxApi: InboxApiInterface,
		private readonly messagePreviewCrypto: InboxKey,
		private readonly messageCrypto: MessageCrypto,
		private readonly addressHasher: AddressesHasher,
		private readonly messageIdCreator: MessageIdCreator,
		private readonly messageDateOffset: number,
	) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing) {
		const axiosConfig = createAxiosConfiguration(sdkConfig);
		const axiosClient = getAxiosWithSigner(keyRing.accountMessagingKey());
		const inboxApi = InboxApiFactory(axiosConfig, undefined, axiosClient);
		const messagePreviewCrypto = keyRing.inboxKey();
		const messageMessageCrypto = createMailchainMessageCrypto(keyRing);
		const addressHasher = mailchainAddressHasher(AddressesApiFactory(axiosConfig), keyRing);
		const messageHasher = createMailchainMessageIdCreator(keyRing);
		return new MailchainMailbox(
			inboxApi,
			messagePreviewCrypto,
			messageMessageCrypto,
			addressHasher,
			messageHasher,
			keyRing.inboxMessageDateOffset(),
		);
	}

	async getMessage(messageId: string): Promise<MessagePreview> {
		const message = await this.inboxApi.getMessage(messageId).then((res) => res.data.message);
		return this.handleMessagePreview(message);
	}

	async getInboxMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInInboxView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getStarredMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInStarredView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getTrashMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInTrashView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getUnreadMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInUnreadView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getSentMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInSentView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getOutboxMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInOutboxView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async getArchivedMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesInArchivedView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async searchMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesSearch().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	private async handleMessagePreviews(messages: ApiMessagePreview[]): Promise<MessagePreview[]> {
		const messagePreviews: MessagePreview[] = [];
		for (const message of messages) {
			messagePreviews.push(await this.handleMessagePreview(message));
		}
		return messagePreviews;
	}

	private async handleMessagePreview(message: ApiMessagePreview): Promise<MessagePreview> {
		const encryptedPreviewData = decodeBase64(message.encryptedPreview);
		const previewData = await this.messagePreviewCrypto.decrypt(encryptedPreviewData);
		const preview = protoInbox.preview.MessagePreview.decode(previewData);

		return {
			messageId: message.messageId,
			owner: preview.owner,
			to: preview.to,
			bcc: preview.bcc,
			cc: preview.cc,
			from: preview.from,
			subject: preview.subject,
			snippet: preview.snippet,
			hasAttachment: preview.hasAttachment,
			timestamp: new Date(preview.timestamp * 1000),
			isRead: !message.systemLabels.includes('unread'),
			systemLabels: message.systemLabels as SystemMessageLabel[],
		};
	}

	async getFullMessage(messageId: string): Promise<Message> {
		const encryptedMessage = await this.inboxApi
			.getEncryptedMessageBody(messageId, { responseType: 'arraybuffer' })
			.then((res) => res.data as ArrayBuffer);

		const messageData = await this.messageCrypto.decrypt(new Uint8Array(encryptedMessage));
		const messageContent = await parseMimeText(messageData.Content.toString());

		return {
			from: messageContent.from.address,
			to: messageContent.recipients.map((r) => r.address),
			subject: messageContent.subject,
			timestamp: messageData.Headers.Created,
			body: messageContent.message,
		};
	}

	async saveSentMessage(params: SaveSentMessageParam): Promise<MessagePreview> {
		const messageId = await this.messageIdCreator({ type: 'sent', mailData: params.content });
		return this.saveMessage(messageId, params.payload, params.content, params.content.from.address, 'outbox');
	}

	async saveReceivedMessage(params: SaveReceivedMessageParam): Promise<MessagePreview> {
		const mailData = await parseMimeText(params.payload.Content.toString());
		const messageId = await this.messageIdCreator({ type: 'received', mailData, owner: params.owner });
		return await this.saveMessage(messageId, params.payload, mailData, params.owner, 'inbox');
	}

	private async saveMessage(
		messageId: string,
		payload: Payload,
		content: MailData,
		owner: string,
		folder: 'inbox' | 'outbox',
	): Promise<MessagePreview> {
		const messagePreview = createMessagePreview(owner, payload, content);
		const encodedMessagePreview = protoInbox.preview.MessagePreview.encode(messagePreview).finish();

		const encryptedMessagePreview = await this.messagePreviewCrypto.encrypt(encodedMessagePreview);
		const encryptedMessage = await this.messageCrypto.encrypt(payload);

		const { recipients: to, carbonCopyRecipients: cc, blindCarbonCopyRecipients: bcc } = content;
		const addresses = [content.from, ...to, ...cc, ...bcc].map((a) => a.address);
		const addressHashes = await this.addressHasher(addresses);

		const { resourceId } = await this.inboxApi.postEncryptedMessageBody(encryptedMessage).then((res) => res.data);

		await this.inboxApi.putEncryptedMessage(messageId, {
			folder:
				folder === 'outbox'
					? PutEncryptedMessageRequestBodyFolderEnum.Outbox
					: PutEncryptedMessageRequestBodyFolderEnum.Inbox,
			date: messagePreview.timestamp - this.messageDateOffset,
			hashedFrom: [...(addressHashes[content.from.address]?.[0] ?? [])],
			hashedTo: flatten(to.map(({ address }) => addressHashes[address]?.map((h) => [...h]) ?? [])),
			hashedCc: flatten(cc.map(({ address }) => addressHashes[address]?.map((h) => [...h]) ?? [])),
			hashedBcc: flatten(bcc.map(({ address }) => addressHashes[address]?.map((h) => [...h]) ?? [])),
			encryptedPreview: encodeBase64(encryptedMessagePreview),
			messageBodyResourceId: resourceId,
		});

		return {
			messageId,
			from: messagePreview.from,
			to: messagePreview.to,
			cc: messagePreview.cc,
			bcc: messagePreview.bcc,
			subject: messagePreview.subject,
			owner: messagePreview.owner,
			snippet: messagePreview.snippet,
			isRead: folder === 'outbox',
			systemLabels: folder === 'outbox' ? ['outbox'] : ['unread', 'inbox'],
			hasAttachment: false,
			timestamp: new Date(messagePreview.timestamp * 1000),
		};
	}

	async markOutboxMessageAsSent(messageId: string): Promise<void> {
		await this.modifySystemLabel(messageId, 'outbox', false);
		await this.modifySystemLabel(messageId, 'sent', true);
	}

	async modifyArchiveMessage(messageId: string, archived: boolean): Promise<void> {
		await this.modifySystemLabel(messageId, 'archive', archived);
	}

	async modifyIsReadMessage(messageId: string, isRead: boolean): Promise<void> {
		await this.modifySystemLabel(messageId, 'unread', !isRead);
	}

	async modifyTrashMessage(messageId: string, trash: boolean): Promise<void> {
		await this.modifySystemLabel(messageId, 'trash', trash);
	}

	async modifyStarredMessage(messageId: string, isStarred: boolean): Promise<void> {
		await this.modifySystemLabel(messageId, 'starred', isStarred);
	}

	private async modifySystemLabel(
		messageId: string,
		systemLabel: SystemMessageLabel,
		include: boolean,
	): Promise<void> {
		await this.modifyUserLabel(messageId, systemLabel, include);
	}

	async modifyUserLabel(messageId: string, userLabel: UserMessageLabel, include: boolean): Promise<void> {
		if (include) {
			await this.inboxApi.putMessageLabel(messageId, userLabel);
		} else {
			await this.inboxApi.deleteMessageLabel(messageId, userLabel);
		}
	}
}

function createMessagePreview(
	owner: string,
	payload: Payload,
	content: MailData,
	snippetLength = 100,
): protoInbox.preview.MessagePreview {
	return protoInbox.preview.MessagePreview.create({
		owner,
		to: content.recipients.map((it) => it.address),
		cc: content.carbonCopyRecipients.map((it) => it.address),
		bcc: content.blindCarbonCopyRecipients.map((it) => it.address),
		from: content.from.address,
		subject: content.subject,
		snippet: content.plainTextMessage.substring(0, snippetLength - 1).trim(),
		hasAttachment: false, // TODO: replace with value from content.attachment when available,
		timestamp: Math.round(payload.Headers.Created.getTime() / 1000),
	});
}
