import { publicKeyFromBytes, publicKeyToBytes, PublicKey } from '@mailchain/crypto';
import { decodeHex, encodeHex } from '@mailchain/encoding';
import { MailerProof } from '@mailchain/signatures';
import canonicalize from 'canonicalize';
import { MailAddress } from '../mail';

/**
 * MailerContent is the content that is sent by the Mailer to each recipient.
 */
export type MailerContent = {
	/**
	 * The author's messaging public key, this MUST match the messaging key in the final `from` address.
	 */
	authorMessagingKey: PublicKey;
	/**
	 * Where the content created by the author can be found.
	 */
	contentUri: string;
	/**
	 * Date message is sent, this will become the Date: header in the email.
	 */
	date: Date;
	/**
	 * The author's mail address, this must resolve to the author messaging key. The will become the `From:` header in the email.
	 */
	authorMailAddress: MailAddress;
	/**
	 * Proof created by the author that authorizes the Mailer to send the message.
	 */
	mailerProof: MailerProof;
	/**
	 * The message ID, this will become the Message-ID: header in the email.
	 * This MUST be unique for each message.
	 */
	messageId: string;
	/**
	 * The recipients of this instance of the message. Typically this will be a single address.
	 */
	to: MailAddress[];
	/**
	 * The version of the MailerContent, currently only `1.0` is supported.
	 */
	version: string;
};

export function createContentBuffer(content: MailerContent): string {
	// fields are alphabetically ordered
	const canonicalized = canonicalize({
		authorMessagingKey: encodeHex(publicKeyToBytes(content.authorMessagingKey)),
		contentUri: content.contentUri,
		date: Math.round(content.date.getTime()),
		authorMailAddress: content.authorMailAddress.address,
		mailerProof: {
			params: {
				authorContentSignature: encodeHex(content.mailerProof.params.authorContentSignature),
				expires: Math.round(content.mailerProof.params.expires.getTime()),
				mailerMessagingKey: encodeHex(publicKeyToBytes(content.mailerProof.params.mailerMessagingKey)),
			},
			signature: encodeHex(content.mailerProof.signature),
			version: content.mailerProof.version,
		},
		messageId: content.messageId,
		to: content.to.map((recipient) => recipient.address),
		version: content.version,
	});

	if (!canonicalized) {
		throw new Error('content could not be canonicalized');
	}

	return canonicalized;
}

export function parseMailerContentFromJSON(content: string): MailerContent {
	type RawMailerContent = {
		authorMailAddress: string;
		authorMessagingKey: string;
		contentUri: string;
		date: number;
		mailerProof: {
			params: {
				expires: number;
				mailerMessagingKey: string;
				authorContentSignature: string;
			};
			signature: string;
			version: string;
		};
		messageId: string;
		to: string[];
		version: string;
	};

	const rawMailerContent: RawMailerContent = JSON.parse(content);

	if (!rawMailerContent.mailerProof) {
		throw new Error('mailerProof is required');
	}

	if (!rawMailerContent.mailerProof.params) {
		throw new Error('mailerProof.params is required');
	}

	if (rawMailerContent.mailerProof.params.authorContentSignature === '') {
		throw new Error('authorContentSignature is required');
	}

	const authorContentSignature = decodeHex(rawMailerContent.mailerProof.params.authorContentSignature);
	if (rawMailerContent.authorMessagingKey === '') {
		throw new Error('authorMessagingKey is required');
	}

	const authorMessagingKey = publicKeyFromBytes(decodeHex(rawMailerContent.authorMessagingKey));

	return {
		authorMessagingKey,
		contentUri: rawMailerContent.contentUri,
		date: new Date(rawMailerContent.date),
		authorMailAddress: { address: rawMailerContent.authorMailAddress, name: '' },
		to: rawMailerContent.to.map((address) => ({ address, name: '' })),
		mailerProof: {
			params: {
				expires: new Date(rawMailerContent.mailerProof.params.expires),
				mailerMessagingKey: publicKeyFromBytes(
					decodeHex(rawMailerContent.mailerProof.params.mailerMessagingKey),
				),
				authorContentSignature,
			},
			signature: decodeHex(rawMailerContent.mailerProof.signature),
			version: rawMailerContent.version,
		},
		messageId: rawMailerContent.messageId,
		version: rawMailerContent.version,
	};
}
