import { PublicKey } from '@mailchain/crypto';

export type MessagePreview = {
	mailbox: PublicKey;
	messageId: string;
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

export type Message = {
	from: string;
	replyTo?: string;
	to: string[];
	cc: string[];
	bcc: string[];
	subject: string;
	timestamp: Date;
	body: string;
};

/** Copy from cmd/inbox/internal/datastore/labels.go */
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
