import { MailchainAddress, formatAddress, parseNameServiceAddress } from '@mailchain/addressing';
import {
	Message as ApiMessagePreview,
	InboxApiFactory,
	InboxApiInterface,
	PutEncryptedMessageRequestBodyFolderEnum,
	createAxiosConfiguration,
	getAxiosWithSigner,
} from '@mailchain/api';
import { publicKeyFromBytes, publicKeyToBytes } from '@mailchain/crypto';
import { decodeBase64, decodeHex, encodeBase64, encodeHex, encodeUtf8 } from '@mailchain/encoding';
import { InboxKey, KeyRing } from '@mailchain/keyring';
import striptags from 'striptags';
import { sha3_256 } from '@noble/hashes/sha3';
import { Configuration } from '..';
import { ParseMimeTextResult, parseMimeText } from '../formatters/parse';
import { IdentityKeys } from '../identityKeys';
import { MailboxRuleEngine } from '../mailboxRuleEngine/mailboxRuleEngine';
import * as protoInbox from '../protobuf/inbox/inbox';
import { MailData, Payload } from '../transport';
import { encodeMailbox } from '../user';
import { UserMailbox } from '../user/types';
import { VerifiablePresentationRequest, parseVerifiablePresentationRequest } from '../verifiableCredentials';
import { AddressesHasher, getAddressHash, getMailAddressesHashes, mailchainAddressHasher } from './addressHasher';
import { createMailchainApiAddressIdentityKeyResolver } from './addressIdentityKeyResolver';
import { MessageIdCreator, createMailchainMessageIdCreator } from './messageId';
import { MessageMailboxOwnerMatcher } from './messageMailboxOwnerMatcher';
import { MessagePreviewMigrationRule, getAllMessagePreviewMigrations } from './migrations';
import {
	FolderMessagesOverview,
	Message,
	MessagePreview,
	MessagesOverview,
	SystemMessageLabel,
	UserMessageLabel,
} from './types';
import { UserMailboxHasher, createMailchainUserMailboxHasher } from './userMailboxHasher';
import { MailboxStorage } from './mailboxStorage';

export type GetMessagesViewParams = {
	offset: number;
	limit: number;
	userMailboxes: UserMailbox[] | 'all';
};

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
	getInboxMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Starred folder (with STARRED label) */
	getStarredMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Trash folder (with TRASH label) */
	getTrashMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Unread folder (without READ label) */
	getUnreadMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Send folder (with SEND label) */
	getSentMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Outbox folder */
	getOutboxMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Archived folder (with ARCHIVED label) */
	getArchivedMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/** Get messages from the Spam folder (with SPAM label). Warn: This feature is still in development, is is not stable for usage. */
	getSpamMessages_unstable(params?: GetMessagesViewParams): Promise<MessagePreview[]>;
	/**  Get overview of mailboxes*/

	/**
	 * Get the full contents of the single message for the provided IDs
	 *
	 * Note: This method accepts both parameters of `messageId` and `resourceId` for simplicity reasons. More info in description of: https://github.com/mailchain/monorepo/pull/2326
	 *
	 * @param messageId The ID of the message to get, this is same ID as the one in {@link MessagePreview.messageId}.
	 * @param resourceId The ID of the message body resource, this is same ID as the one in {@link MessagePreview.messageBodyResourceId}.
	 */
	getFullMessage(messageId: string, resourceId: string): Promise<Message>;

	getMessagesOverview(mailboxes: UserMailbox[]): Promise<MessagesOverview>;

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
		/** Cryptography service for encrypting the message preview content when the message is being saved. It is decrypting the same content when the message preview is being read. */
		private readonly messagePreviewCrypto: InboxKey,
		private readonly mailboxStorage: MailboxStorage,
		/** Service for matching the user mailboxes to the message recipients. The case could be that single message send to a single identity belongs to multiple mailbox aliases. */
		private readonly messageMailboxOwnerMatcher: MessageMailboxOwnerMatcher,
		/** Hasher for the addresses of the participants in a given message. Used for hashing each of the participants so at later stage the user is able to use the hashed address to search for messages without reveling the real address that is being searched for. */
		private readonly addressHasher: AddressesHasher,
		/** Create the message ID for when send and received messages are saved. It is used to create a unique ID for a given message parameters. Using same parameters will yield the same message ID. */
		private readonly messageIdCreator: MessageIdCreator,
		/** Hasher for the user mailbox for when send and received messages are saved. It obfuscates the real user mailbox (identity key) in order to increase user privacy. */
		private readonly userMailboxHasher: UserMailboxHasher,
		/** Random time offset that will be added to the message timestamps in order to obfuscate the time when the message was sent/received in order to increase user privacy. */
		private readonly messageDateOffset: number,
		private readonly migration: MessagePreviewMigrationRule,
		/** The {@link MailboxRuleEngine} is used to apply rules to received messages (ex. message filtering) when they are saved. If `null`, no rules will be applied and this step is skipped. */
		private readonly ruleEngine: MailboxRuleEngine | null,
	) {}

	static create(
		sdkConfig: Configuration,
		keyRing: KeyRing,
		mailboxRuleEngine: MailboxRuleEngine | null,
		mailboxStorage: MailboxStorage,
	): MailboxOperations {
		const axiosConfig = createAxiosConfiguration(sdkConfig.apiPath);
		const axiosClient = getAxiosWithSigner(keyRing.accountMessagingKey());
		const inboxApi = InboxApiFactory(axiosConfig, undefined, axiosClient);
		const messagePreviewCrypto = keyRing.inboxKey();
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
			mailboxStorage,
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

	async getInboxMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInInboxView, params);
	}

	async getStarredMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInStarredView, params);
	}

	async getTrashMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInTrashView, params);
	}

	async getUnreadMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInUnreadView, params);
	}

	async getSentMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInSentView, params);
	}

	async getOutboxMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInOutboxView, params);
	}

	async getArchivedMessages(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInArchivedView, params);
	}

	async getSpamMessages_unstable(params?: GetMessagesViewParams): Promise<MessagePreview[]> {
		return this.getMessagesInView(this.inboxApi.getMessagesInSpamView, params);
	}

	private async getMessagesInView(
		viewMethod: InboxApiInterface['getMessagesInInboxView'],
		params?: GetMessagesViewParams,
	) {
		const hashedMailbox = Array.isArray(params?.userMailboxes)
			? (await Promise.all(params!.userMailboxes.map((m) => this.userMailboxHasher(m)))).map(encodeHex)
			: undefined;
		const labels = undefined,
			from = undefined,
			to = undefined;
		const {
			data: { messages },
		} = await viewMethod(labels, from, to, params?.offset, params?.limit, hashedMailbox);
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
			kind: apiMessage.kind,
			mailbox: publicKeyFromBytes(messagePreview.mailbox),
			messageId: apiMessage.messageId,
			messageBodyResourceId: apiMessage.messageBodyResourceId,
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

	async getFullMessage(messageId: string, resourceId: string): Promise<Message> {
		const messageData = await this.mailboxStorage.getPayload(messageId, resourceId);
		switch (messageData.Headers.ContentType) {
			case 'application/vnd.mailchain.verified-credential-request':
				return { body: encodeUtf8(messageData.Content), payloadHeaders: messageData.Headers };
			case 'message/x.mailchain':
			case 'message/x.mailchain-mailer':
				const { mailData } = await this.extractPayloadInfo(messageData);
				return {
					replyTo: mailData.replyTo ? mailData.replyTo.address : undefined,
					body: mailData.message,
					payloadHeaders: messageData.Headers,
				};
			default:
				throw new Error(`Unsupported content type of full message: ${messageData.Headers.ContentType}`);
		}
	}

	async getMessagesOverview(mailboxes: UserMailbox[]): Promise<MessagesOverview> {
		const hashedMailboxes = new Map<string, UserMailbox>(
			await Promise.all(
				mailboxes.map((mailbox) =>
					this.userMailboxHasher(mailbox).then(
						(mailboxHash) => [encodeHex(mailboxHash), mailbox] as [string, UserMailbox],
					),
				),
			),
		);

		const folders = new Map<string, FolderMessagesOverview>();
		const messagesOverview: MessagesOverview = { total: 0, unread: 0, folders };
		const { data: apiMessagesOverview } = await this.inboxApi.getMailboxOverview([...hashedMailboxes.keys()]);
		apiMessagesOverview.mailboxes.forEach((apiMailboxOverview) => {
			const mailbox = hashedMailboxes.get(apiMailboxOverview.mailbox);
			if (mailbox == null) {
				console.warn(
					`getMailboxOverview returned mailbox (${apiMailboxOverview.mailbox}) that was not requested mailboxes`,
				);
				return;
			}

			apiMailboxOverview.labels.forEach((apiLabelOverview) => {
				const folderOverview: FolderMessagesOverview = folders.get(apiLabelOverview.label) ?? {
					total: 0,
					unread: 0,
					mailboxes: new Map(),
				};

				folderOverview.total += apiLabelOverview.total;
				folderOverview.unread += apiLabelOverview.unread;
				if (!['starred'].includes(apiLabelOverview.label)) {
					// Don't count 'starred' messages in the overall total/unread count as they are already in the inbox/archive/etc.
					messagesOverview.total += apiLabelOverview.total;
					messagesOverview.unread += apiLabelOverview.unread;
				}
				folderOverview.mailboxes.set(encodeMailbox(mailbox), {
					total: apiLabelOverview.total,
					unread: apiLabelOverview.unread,
				});

				folders.set(apiLabelOverview.label, folderOverview);
			});
		});

		return messagesOverview;
	}

	async saveSentMessage(params: SaveSentMessageParam): Promise<MessagePreview> {
		const messageId = await this.messageIdCreator({ type: 'sent', mailData: params.content });
		const owner = parseNameServiceAddress(params.content.from.address);
		return this.saveMessage(messageId, params.payload, params.content, params.userMailbox, owner, 'outbox');
	}

	async extractPayloadInfo(payload: Payload): Promise<ParseMimeTextResult> {
		switch (payload.Headers.ContentType) {
			case 'message/x.mailchain':
			case 'message/x.mailchain-mailer':
				return parseMimeText(payload.Content);
			case 'application/vnd.mailchain.verified-credential-request':
				// FIXME: VC Request is not considered a mail so fitting it into the MailData is not correct. This is a temporary solution.
				const jsonStr = encodeUtf8(payload.Content);
				const messageId = encodeHex(
					sha3_256(
						Uint8Array.from([
							...payload.Content,
							...decodeHex(payload.Headers.Created.getTime().toString()),
						]),
					),
				);
				const vcRequest: VerifiablePresentationRequest = parseVerifiablePresentationRequest(jsonStr);
				const vcMailData: MailData = {
					id: messageId,
					subject: 'Verifiable Presentation Request',
					from: {
						address: vcRequest.from,
						name: vcRequest.from,
					},
					date: payload.Headers.Created,
					recipients: [
						{
							address: vcRequest.to,
							name: vcRequest.to,
						},
					],
					carbonCopyRecipients: [],
					blindCarbonCopyRecipients: [],
					message: jsonStr,
					plainTextMessage: `Request for ${vcRequest.resources.join(
						', ',
					)} to perform ${vcRequest.actions.join(', ')}).`,
				};

				return {
					mailData: vcMailData,
					addressIdentityKeys: new Map(),
				};
			default:
				throw new Error(`Unsupported content type: ${payload.Headers.ContentType}`);
		}
	}

	async saveReceivedMessage({
		userMailbox,
		receivedTransportPayload,
	}: SaveReceivedMessageParam): Promise<[MessagePreview, ...MessagePreview[]]> {
		const payload = receivedTransportPayload;
		const { mailData, addressIdentityKeys } = await this.extractPayloadInfo(payload);
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
			if (this.ruleEngine != null) {
				const ruleEngineOutput = await this.ruleEngine.apply({ message: savedMessage });
				savedMessages.push(ruleEngineOutput.message);
			} else {
				savedMessages.push(savedMessage);
			}
		}

		if (savedMessages.length === 0) {
			throw new Error(`no message was saved for message with ID [${mailData.id}]`);
		}

		return savedMessages as [MessagePreview, ...MessagePreview[]];
	}

	private async saveMessage(
		messageId: string,
		payload: Payload,
		content: MailData,
		userMailbox: UserMailbox,
		owner: MailchainAddress,
		folder: 'inbox' | 'outbox',
	): Promise<MessagePreview> {
		const ownerAddress = formatAddress(owner, 'mail');

		const protoMessagePreview = createProtoMessagePreview(userMailbox, owner, content);
		const encodedProtoMessagePreview = protoInbox.preview.MessagePreview.encode(protoMessagePreview).finish();
		const encryptedProtoMessagePreview = await this.messagePreviewCrypto.encrypt(encodedProtoMessagePreview);

		const { recipients: to, carbonCopyRecipients: cc, blindCarbonCopyRecipients: bcc } = content;
		const addresses = [content.from, ...to, ...cc, ...bcc].map((a) => a.address);
		addresses.push(ownerAddress);
		const addressHashes = await this.addressHasher(addresses);

		const resourceId = await this.mailboxStorage.storePayload(payload);

		const messagePreview: MessagePreview = {
			kind:
				payload.Headers.ContentType === 'application/vnd.mailchain.verified-credential-request'
					? 'vc-request'
					: 'mail',
			mailbox: userMailbox.identityKey,
			messageId,
			messageBodyResourceId: resourceId,
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

		await this.inboxApi.putEncryptedMessage(messageId, {
			kind: messagePreview.kind,
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
			messageBodyResourceId: messagePreview.messageBodyResourceId,
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
		snippet: createMessagePreviewSnippet(content, snippetLength),
		hasAttachment: false, // TODO: replace with value from content.attachment when available,
		timestamp: Math.round(content.date.getTime() / 1000),
	});
}

function createMessagePreviewSnippet(content: MailData, snippetLength = 100): string {
	const plainTextMessage = striptags(content.plainTextMessage).replace(/\s+/g, ' ');
	return plainTextMessage.substring(0, snippetLength - 1).trim();
}
