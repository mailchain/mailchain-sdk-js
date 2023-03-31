import { PublicKey } from '@mailchain/crypto';
import { createContentBuffer, MailerContent, parseMailerContentFromJSON } from '../../transport';
import {
	createOriginHeader,
	createSignatureHeader,
	headersMapFromBuffers,
	parseOriginHeader,
	parseSignatureHeader,
	SerializablePayloadHeaders,
} from '../../transport/serialization';

type ContentType = 'application/json' | 'message/x.mailchain' | 'message/x.mailchain-mailer';
/**
 * MailPayloadHeaders are the headers provide information about the payload.
 */
export type MailPayloadHeaders = {
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
	ContentType: ContentType;

	/**
	 * Used to specify the compression algorithm.
	 */
	ContentEncoding: string;

	/**
	 * Used to specify the encryption algorithm.
	 */
	ContentEncryption: string;

	/**
	 * Stores original Mailer Payload when the Mail was sent with Mailer.
	 */
	MailerContent?: MailerContent;
};

const HEADER_CONTENT_ENCODING = 'Content-Encoding';
const HEADER_CONTENT_ENCRYPTION = 'Content-Encryption';
const HEADER_CONTENT_LENGTH = 'Content-Length';
const HEADER_CONTENT_SIGNATURE = 'Content-Signature';
const HEADER_CONTENT_TYPE = 'Content-Type';
const HEADER_CREATED = 'Created';
const HEADER_ORIGIN = 'Origin';
const HEADER_MAILER_CONTENT = 'Mailer-Content';

export class SerializableMailPayloadHeaders implements SerializablePayloadHeaders {
	headers: MailPayloadHeaders;

	constructor(headers: MailPayloadHeaders) {
		this.headers = headers;
	}
	static FromEncryptedMailPayloadHeaders(headers: MailPayloadHeaders): SerializableMailPayloadHeaders {
		return new this(headers);
	}

	static FromBuffer(buffer: Buffer): SerializableMailPayloadHeaders {
		const { headers } = headersMapFromBuffers(buffer, [
			HEADER_CONTENT_ENCODING,
			HEADER_CONTENT_ENCRYPTION,
			HEADER_CONTENT_LENGTH,
			HEADER_CONTENT_SIGNATURE,
			HEADER_CONTENT_TYPE,
			HEADER_CREATED,
			HEADER_ORIGIN,
		]);

		const output = {
			ContentEncoding: headers.get(HEADER_CONTENT_ENCODING)!.toString(),
			ContentEncryption: headers.get(HEADER_CONTENT_ENCRYPTION)!.toString(),
			ContentLength: Number.parseInt(headers.get(HEADER_CONTENT_LENGTH)!.toString()!),
			ContentSignature: parseSignatureHeader(headers.get(HEADER_CONTENT_SIGNATURE)!.toString()),
			ContentType: headers.get(HEADER_CONTENT_TYPE)!.toString() as ContentType,
			Created: new Date(headers.get(HEADER_CREATED)!.toString()!),
			Origin: parseOriginHeader(headers.get(HEADER_ORIGIN)!.toString()),
		} as MailPayloadHeaders;

		if (headers.get(HEADER_MAILER_CONTENT)) {
			output.MailerContent = parseMailerContentFromJSON(headers.get(HEADER_MAILER_CONTENT)!.toString());
		}

		return new this(output);
	}

	ToBuffer(): Buffer {
		const headers: string[] = [];
		headers.push(`${HEADER_CONTENT_ENCODING}: ${this.headers.ContentEncoding}`);
		headers.push(`${HEADER_CONTENT_ENCRYPTION}: ${this.headers.ContentEncryption}`);
		headers.push(`${HEADER_CONTENT_LENGTH}: ${this.headers.ContentLength}`);
		headers.push(
			`${HEADER_CONTENT_SIGNATURE}: ${createSignatureHeader(this.headers.ContentSignature, this.headers.Origin)}`,
		);
		headers.push(`${HEADER_CONTENT_TYPE}: ${this.headers.ContentType}`);
		headers.push(`${HEADER_CREATED}: ${this.headers.Created.toISOString()}`);

		headers.push(`${HEADER_ORIGIN}: ${createOriginHeader(this.headers.Origin)}`);

		if (this.headers.MailerContent) {
			headers.push(`${HEADER_MAILER_CONTENT}:  ${createContentBuffer(this.headers.MailerContent)}`);
		}

		return Buffer.from(headers.join('\r\n'), 'utf8');
	}
}
