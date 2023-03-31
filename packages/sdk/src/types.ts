import { Address } from '@mailchain/internal/sending/mail';

export type MessagePreview = {
	/**
	 * The Mailchain identification for message for further referencing with Mailchain.
	 *
	 * Note: Not related to the 'Message-Id' mail header.
	 */
	mailchainMessageId: string;
	from: Address;
	to: Address[];
	cc: Address[];
	bcc: Address[];
	/** The subject of the email. */
	subject: string;
	/** A short part of the message text. */
	snippet: string;
	/** List of labels applied to this message. Can contain both system labels and custom user labels. */
	labels: string[];
	/** The thread that this message belongs to */
	threadId: string;
	/** Message creation timestamp  */
	date: Date;
	/** Estimated size in bytes of the message. */
	sizeEstimate: number;
	hasAttachment: boolean;
	/** @deprecated will get removed in favor of message grouping */
	owner: string;
};

/** Attachment that part of the message. */
type IncomingAttachment = {
	/** Unique identifier for the attachment that can be used to reference it to embed it into the content of the mail content. */
	cid: string;
	/** The name to appear when showing and downloading the attachment.  */
	name: string;
	/** Estimated size in bytes of the attachment.  */
	sizeEstimate: number;
};

/** Attachment that part of the message and it is embedded as part of the content. */
type EmbeddedIncomingAttachment = IncomingAttachment & {
	content: Buffer;
};

// Self note: Separate `Message` is returned by the request in order not to do unnecessary network traffic and encryption/decryption.
/** The content for the message of {@link MessagePreview}. */
export type Message = {
	mailchainMessageId: string;
	/**
	 * Contains the content of the message.
	 *
	 * - `'html'` - The HTML content part of the message as UTF-8 encoded string.
	 * - `'text'` - The plain/text content part of the message as UTF-8 encoded string.
	 * - `'raw'` - The entire email message in an RFC 2822 formatted and base64url encoded string.
	 */
	content: {
		type: 'html' | 'text' | 'raw';
		value: string;
	};
	allAttachments: IncomingAttachment[];
	embeddedAttachments: EmbeddedIncomingAttachment[];
};
