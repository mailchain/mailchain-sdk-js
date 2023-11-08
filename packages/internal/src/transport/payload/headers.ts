import { PublicKey } from '@mailchain/crypto';

export type ContentType =
	| 'application/json'
	| 'message/x.mailchain'
	| 'message/x.mailchain-mailer'
	| 'application/vnd.mailchain.verified-credential-request';

/**
 * PayloadHeaders are the headers provide information about the payload.
 */
export type PayloadHeaders<CT extends ContentType = ContentType> = {
	/**
	 * public key of sender to verify the contents
	 */
	Origin: PublicKey;
	/**
	 * used to verify un-encrypted contents
	 */
	ContentSignature: Uint8Array;

	Created: Date;

	// Standard

	/**
	 * The size of the resource, in decimal number of bytes.
	 * The Content-Length header indicates the size of the message body, in bytes, sent to the recipient.
	 */
	ContentLength: number;

	/**
	 * Indicates the media type of the resource.
	 * The ContentType representation header is used to indicate the original media type of the resource (prior to any content encoding and encryption applied for sending).
	 * In responses, a ContentType header provides the client with the actual content type of the returned content.
	 */
	ContentType: CT;

	/**
	 * Used to specify the compression algorithm.
	 */
	ContentEncoding: string;

	/**
	 * Used to specify the encryption algorithm.
	 */
	ContentEncryption: string;

	/**
	 * Indicates an alternate location for the contents if not contained in this object.
	 */
	ContentLocation?: string;
	/**
	 * Custom set of headers used by plugins.
	 */
	PluginHeaders?: {
		[x: string]: unknown;
	};
};
