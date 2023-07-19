import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { KeyRing, InboxKey } from '@mailchain/keyring';
import { formatAddress, MailchainAddress, parseNameServiceAddress } from '@mailchain/addressing';
import { publicKeyFromBytes, publicKeyToBytes } from '@mailchain/crypto';
import {
	InboxApiInterface,
	PutEncryptedMessageRequestBodyFolderEnum,
	Message as ApiMessagePreview,
	InboxApiFactory,
	createAxiosConfiguration,
	getAxiosWithSigner,
} from '@mailchain/api';
import { IdentityKeys } from '../identityKeys';
import { MailData, Payload } from '../transport';
import * as protoInbox from '../protobuf/inbox/inbox';
import { parseMimeText } from '../formatters/parse';
import { Configuration } from '..';
import { UserMailbox } from '../user/types';
import { MailboxRuleEngine } from '../mailboxRuleEngine/mailboxRuleEngine';
import { AddressesHasher, getAddressHash, getMailAddressesHashes, mailchainAddressHasher } from './addressHasher';
import { createMailchainMessageIdCreator, MessageIdCreator } from './messageId';
import { createMailchainMessageCrypto, MessageCrypto } from './messageCrypto';
import { MessagePreview, UserMessageLabel, SystemMessageLabel, Message } from './types';
import { createMailchainUserMailboxHasher, UserMailboxHasher } from './userMailboxHasher';
import { MessageMailboxOwnerMatcher } from './messageMailboxOwnerMatcher';
import { createMailchainApiAddressIdentityKeyResolver } from './addressIdentityKeyResolver';
import { getAllMessagePreviewMigrations, MessagePreviewMigrationRule } from './migrations';
import { MailPayload, convertPayload } from './payload/payload';

type SaveSentMessageParam = {
	/** The {@link UserMailbox} that is sending this message */
	userMailbox: UserMailbox;
	payload: Payload;
	content: MailData;
};

type SaveReceivedMessageParam = {
	/** The {@link UserMailbox} that is receiving this message */
	userMailbox: UserMailbox;
	receivedTransportPayload: Payload;
};

export interface MailboxOperations {
	/** Get {@link MessagePreview} for a single message. */
	getMessage(messageId: string): Promise<MessagePreview>;

	// GETTING MESSAGES
	/** Get messages from the Inbox folder (with INBOX label) */
	getInboxMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Starred folder (with STARRED label) */
	getStarredMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Trash folder (with TRASH label) */
	getTrashMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Unread folder (without READ label) */
	getUnreadMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Send folder (with SEND label) */
	getSentMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Outbox folder */
	getOutboxMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Archived folder (with ARCHIVED label) */
	getArchivedMessages(): Promise<MessagePreview[]>;
	/** Get messages from the Spam folder (with SPAM label). Warn: This feature is still in development, is is not stable for usage. */
	getSpamMessages_unstable(): Promise<MessagePreview[]>;
	searchMessages(): Promise<MessagePreview[]>;

	/** Get the full contents of the single message for the provided ID (same as the {@link MessagePreview.id}) */
	getFullMessage(messageId: string): Promise<Message>;

	// SAVING MESSAGES
	/**
	 * Save the send message
	 *
	 * Note: initially the message is put into Outbox folder and needs to me marked as send via {@link MailboxOperations.markOutboxMessageAsSent}
	 */
	saveSentMessage(message: SaveSentMessageParam): Promise<MessagePreview>;
	/** Save the received message. */
	saveReceivedMessage(message: SaveReceivedMessageParam): Promise<[MessagePreview, ...MessagePreview[]]>;

	// MESSAGE ACTIONS
	markOutboxMessageAsSent(messageId: string): Promise<void>;
	modifyArchiveMessage(messageId: string, archived: boolean): Promise<void>;
	modifyIsReadMessage(messageId: string, isRead: boolean): Promise<void>;
	modifyTrashMessage(messageId: string, trash: boolean): Promise<void>;
	modifyStarredMessage(messageId: string, isStarred: boolean): Promise<void>;
	modifySystemLabel(messageId: string, systemLabel: SystemMessageLabel, include: boolean): Promise<void>;
	/**  Warn: This feature is still in development, is is not stable for usage. */
	modifySpamMessage_unstable(messageId: string, isSpam: boolean): Promise<void>;
	modifyUserLabel(messageId: string, userLabel: UserMessageLabel, include: boolean): Promise<void>;
}

export class MailchainMailboxOperations implements MailboxOperations {
	constructor(
		private readonly inboxApi: InboxApiInterface,
		private readonly messagePreviewCrypto: InboxKey,
		private readonly messageCrypto: MessageCrypto,
		private readonly messageMailboxOwnerMatcher: MessageMailboxOwnerMatcher,
		private readonly addressHasher: AddressesHasher,
		private readonly messageIdCreator: MessageIdCreator,
		private readonly userMailboxHasher: UserMailboxHasher,
		private readonly messageDateOffset: number,
		private readonly migration: MessagePreviewMigrationRule,
		private readonly ruleEngine: MailboxRuleEngine,
	) {}

	static create(sdkConfig: Configuration, keyRing: KeyRing, mailboxRuleEngine: MailboxRuleEngine): MailboxOperations {
		const axiosConfig = createAxiosConfiguration(sdkConfig.apiPath);
		const axiosClient = getAxiosWithSigner(keyRing.accountMessagingKey());
		const inboxApi = InboxApiFactory(axiosConfig, undefined, axiosClient);
		const messagePreviewCrypto = keyRing.inboxKey();
		const messageMessageCrypto = createMailchainMessageCrypto(keyRing);
		const messageMailboxOwnerMatcher = MessageMailboxOwnerMatcher.create(sdkConfig);
		const addressHasher = mailchainAddressHasher(
			createMailchainApiAddressIdentityKeyResolver(IdentityKeys.create(sdkConfig)),
			keyRing,
		);
		const messageHasher = createMailchainMessageIdCreator(keyRing);
		const userMailboxHasher = createMailchainUserMailboxHasher(keyRing);

		const mailboxOperations = new MailchainMailboxOperations(
			inboxApi,
			messagePreviewCrypto,
			messageMessageCrypto,
			messageMailboxOwnerMatcher,
			addressHasher,
			messageHasher,
			userMailboxHasher,
			keyRing.inboxMessageDateOffset(),
			getAllMessagePreviewMigrations(sdkConfig),
			mailboxRuleEngine,
		);

		return mailboxOperations;
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

	async getSpamMessages_unstable(): Promise<MessagePreview[]> {
		const messages: ApiMessagePreview[] = []; // await this.inboxApi.getMessagesInSpamView().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	async searchMessages(): Promise<MessagePreview[]> {
		const messages = await this.inboxApi.getMessagesSearch().then((res) => res.data.messages);
		return this.handleMessagePreviews(messages);
	}

	private async handleMessagePreviews(messages: ApiMessagePreview[]): Promise<MessagePreview[]> {
		const messagePreviews: MessagePreview[] = [];
		for (const message of messages) {
			try {
				messagePreviews.push(await this.handleMessagePreview(message));
			} catch (error) {
				// TODO: decide how to handle
				console.error(
					`failed to read message preview: version=${message.version};messageId=${message.messageId}`,
					error,
				);
			}
		}
		return messagePreviews;
	}

	private async handleMessagePreview(apiMessage: ApiMessagePreview): Promise<MessagePreview> {
		const encryptedPreviewData = decodeBase64(apiMessage.encryptedPreview);
		// const previewData = await this.messagePreviewCrypto.decrypt(encryptedPreviewData);
		// const preview = protoInbox.preview.MessagePreview.decode(previewData);

		const originalPreviewData = {
			version: apiMessage.version,
			messagePreview: protoInbox.preview.MessagePreview.decode(
				await this.messagePreviewCrypto.decrypt(encryptedPreviewData),
			),
		};

		const message = (await this.migration.shouldApply(originalPreviewData))
			? await this.migration.apply(originalPreviewData)
			: originalPreviewData;

		if (apiMessage.version !== message.version) {
			console.debug(`${apiMessage.messageId} migrated from v${apiMessage.version} to v${message.version}`);
			// TODO #750: save migrated message to Mailchain
		}

		const { messagePreview } = message;

		return {
			mailbox: publicKeyFromBytes(messagePreview.mailbox),
			messageId: apiMessage.messageId,
			owner: messagePreview.owner,
			to: messagePreview.to,
			bcc: messagePreview.bcc,
			cc: messagePreview.cc,
			from: messagePreview.from,
			subject: messagePreview.subject,
			snippet: messagePreview.snippet,
			hasAttachment: messagePreview.hasAttachment,
			timestamp: new Date(messagePreview.timestamp * 1000),
			isRead: !apiMessage.systemLabels.includes('unread'),
			systemLabels: apiMessage.systemLabels as SystemMessageLabel[],
		};
	}

	async getFullMessage(messageId: string): Promise<Message> {
		const encryptedMessage = await this.inboxApi
			.getEncryptedMessageBody(messageId, { responseType: 'arraybuffer' })
			.then((res) => res.data as ArrayBuffer);

		const messageData = await this.messageCrypto.decrypt(new Uint8Array(encryptedMessage));
		const { mailData } = await parseMimeText(messageData.Content);
		const to = mailData.recipients.map((r) => r.address);
		const cc = mailData.carbonCopyRecipients.map((r) => r.address);
		const bcc = mailData.blindCarbonCopyRecipients.map((r) => r.address);

		return {
			from: mailData.from.address,
			to,
			replyTo: mailData.replyTo ? mailData.replyTo.address : undefined,
			subject: mailData.subject,
			timestamp: mailData.date,
			body: mailData.message,
			cc,
			bcc,
		};
	}

	async saveSentMessage(params: SaveSentMessageParam): Promise<MessagePreview> {
		const messageId = await this.messageIdCreator({ type: 'sent', mailData: params.content });
		const owner = parseNameServiceAddress(params.content.from.address);
		return this.saveMessage(messageId, params.payload, params.content, params.userMailbox, owner, 'outbox');
	}

	async saveReceivedMessage({
		userMailbox,
		receivedTransportPayload,
	}: SaveReceivedMessageParam): Promise<[MessagePreview, ...MessagePreview[]]> {
		const payload = convertPayload(receivedTransportPayload);
		const { mailData, addressIdentityKeys } = await parseMimeText(payload.Content);
		const owners = await this.messageMailboxOwnerMatcher
			.withMessageIdentityKeys(addressIdentityKeys)
			.findMatches(mailData, userMailbox);
		if (owners.length === 0) throw new Error('no owners found for message');

		const savedMessages: MessagePreview[] = [];
		for (const { address: owner } of owners) {
			const messageId = await this.messageIdCreator({
				type: 'received',
				mailData,
				owner: formatAddress(owner, 'mail'),
				mailbox: userMailbox.identityKey,
			});
			const savedMessage = await this.saveMessage(messageId, payload, mailData, userMailbox, owner, 'inbox');
			// TODO: Run the message through the mailbox rules engine
			savedMessages.push(savedMessage);
		}

		if (savedMessages.length === 0) {
			throw new Error(`no message was saved for message with ID [${mailData.id}]`);
		}

		return savedMessages as [MessagePreview, ...MessagePreview[]];
	}

	private async saveMessage(
		messageId: string,
		payload: MailPayload,
		content: MailData,
		userMailbox: UserMailbox,
		owner: MailchainAddress,
		folder: 'inbox' | 'outbox',
	): Promise<MessagePreview> {
		const ownerAddress = formatAddress(owner, 'mail');

		const protoMessagePreview = createProtoMessagePreview(userMailbox, owner, content);
		const encodedProtoMessagePreview = protoInbox.preview.MessagePreview.encode(protoMessagePreview).finish();
		const encryptedProtoMessagePreview = await this.messagePreviewCrypto.encrypt(encodedProtoMessagePreview);

		const messagePreview: MessagePreview = {
			mailbox: userMailbox.identityKey,
			messageId,
			from: protoMessagePreview.from,
			to: protoMessagePreview.to,
			cc: protoMessagePreview.cc,
			bcc: protoMessagePreview.bcc,
			subject: protoMessagePreview.subject,
			owner: protoMessagePreview.owner,
			snippet: protoMessagePreview.snippet,
			isRead: folder === 'outbox',
			systemLabels: folder === 'outbox' ? ['outbox'] : ['unread', 'inbox'],
			hasAttachment: false,
			timestamp: new Date(protoMessagePreview.timestamp * 1000),
		};

		const encryptedMessage = await this.messageCrypto.encrypt(payload);

		const { recipients: to, carbonCopyRecipients: cc, blindCarbonCopyRecipients: bcc } = content;
		const addresses = [content.from, ...to, ...cc, ...bcc].map((a) => a.address);
		addresses.push(ownerAddress);
		const addressHashes = await this.addressHasher(addresses);

		const { resourceId } = await this.inboxApi.postEncryptedMessageBody(encryptedMessage).then((res) => res.data);

		await this.inboxApi.putEncryptedMessage(messageId, {
			version: 3,
			folder:
				folder === 'outbox'
					? PutEncryptedMessageRequestBodyFolderEnum.Outbox
					: PutEncryptedMessageRequestBodyFolderEnum.Inbox,
			date: messagePreview.timestamp.getTime() / 1000 - this.messageDateOffset,
			mailbox: Array.from(await this.userMailboxHasher(userMailbox)),
			// Note: 'hashedOwner' is only 'username' hash because there is no need for 'identity-key' because that is covered by 'mailbox'
			hashedOwner: Array.from(getAddressHash(addressHashes, ownerAddress, 'username')),
			// Note: 'hashedFrom' takes only single type of hash because there is API type restriction, so 'identity-key' hash is proffered.
			hashedFrom: Array.from(getAddressHash(addressHashes, content.from.address, 'identity-key', 'username')),
			hashedTo: getMailAddressesHashes(addressHashes, to).map((h) => Array.from(h)),
			hashedCc: getMailAddressesHashes(addressHashes, cc).map((h) => Array.from(h)),
			hashedBcc: getMailAddressesHashes(addressHashes, bcc).map((h) => Array.from(h)),
			encryptedPreview: encodeBase64(encryptedProtoMessagePreview),
			messageBodyResourceId: resourceId,
		});

		return messagePreview;
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

	async modifySpamMessage_unstable(messageId: string, isSpam: boolean): Promise<void> {
		await this.modifySystemLabel(messageId, 'spam', isSpam);
	}

	async modifySystemLabel(messageId: string, systemLabel: SystemMessageLabel, include: boolean): Promise<void> {
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

function createProtoMessagePreview(
	userMailbox: UserMailbox,
	owner: MailchainAddress,
	content: MailData,
	snippetLength = 100,
): protoInbox.preview.MessagePreview {
	return protoInbox.preview.MessagePreview.create({
		owner: formatAddress(owner, 'mail'),
		mailbox: publicKeyToBytes(userMailbox.identityKey),
		to: content.recipients.map((it) => it.address),
		cc: content.carbonCopyRecipients.map((it) => it.address),
		bcc: content.blindCarbonCopyRecipients.map((it) => it.address),
		from: content.from.address,
		subject: content.subject,
		snippet: content.plainTextMessage.substring(0, snippetLength - 1).trim(),
		hasAttachment: false, // TODO: replace with value from content.attachment when available,
		timestamp: Math.round(content.date.getTime() / 1000),
	});
}
