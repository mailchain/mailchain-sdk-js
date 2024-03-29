import type { PublicKey } from '@mailchain/crypto';
import type { PayloadHeaders } from '../transport/payload/headers';

export type MessagesOverview = {
	total: number;
	unread: number;
	folders: Map<string, FolderMessagesOverview>;
};

export type FolderMessagesOverview = {
	total: number;
	unread: number;
	mailboxes: Map<string, MailboxMessagesOverview>;
};

export type MailboxMessagesOverview = {
	total: number;
	unread: number;
};

export type MessageKind = 'mail' | 'vc-request';

export type MessagePreview = {
	kind: MessageKind;
	mailbox: PublicKey;
	messageId: string;
	messageBodyResourceId: string;
	from: string;
	owner: string;
	subject: string;
	snippet: string;
	isRead: boolean;
	systemLabels: SystemMessageLabel[];
	hasAttachment: boolean;
	timestamp: Date;
	to: string[];
	cc: string[];
	bcc: string[];
};

export type Message<H extends PayloadHeaders = PayloadHeaders> = {
	replyTo?: string;
	body: string;
	payloadHeaders: H;
};

/** Copy from services/inbox/internal/datastore/labels.go */
export const SYSTEM_MESSAGE_LABELS = [
	'archive',
	'draft',
	'inbox',
	'sent',
	'spam',
	'starred',
	'trash',
	'unread',
	'outbox',
] as const;
export type SystemMessageLabel = (typeof SYSTEM_MESSAGE_LABELS)[number];
export type UserMessageLabel = string;
