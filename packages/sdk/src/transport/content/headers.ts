import { KindFromPublicKey, PublicKeyFromKind } from '@mailchain/crypto/multikey/names';
import { PublicKey } from '@mailchain/crypto/public';
import { DecodeBase64, EncodeBase64 } from '@mailchain/encoding';

type ContentType = 'application/json' | 'message/x.mailchain';
export type PayloadHeaders = {
	// Origin?: Uint8Array;
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
	 * Indicates an alternate location for the contents if not contained in this object.
	 */
	ContentLocation?: string;
};

const HEADER_CONTENT_ENCODING = 'Content-Encoding';
const HEADER_CONTENT_ENCRYPTION = 'Content-Encryption';
const HEADER_CONTENT_LENGTH = 'Content-Length';
const HEADER_CONTENT_LOCATION = 'Content-Location';
const HEADER_CONTENT_SIGNATURE = 'Content-Signature';
const HEADER_CONTENT_TYPE = 'Content-Type';
const HEADER_CREATED = 'Created';
const HEADER_ORIGIN = 'Origin';

export class SerializablePayloadHeaders {
	headers: PayloadHeaders;

	constructor(headers: PayloadHeaders) {
		this.headers = headers;
	}
	static FromEncryptedPayloadHeaders(headers: PayloadHeaders): SerializablePayloadHeaders {
		return new this(headers);
	}

	static FromBuffer(buffer: Buffer): SerializablePayloadHeaders {
		const invalidHeaders: string[] = [];
		const headers = new Map<String, String>();
		buffer
			.toString('utf8')
			.split('\r\n')
			.forEach((line) => {
				if (line.indexOf(':') === -1) {
					// splitting on ":" causes problem with dates
					invalidHeaders.push(line);
				}

				headers.set(line.slice(0, line.indexOf(':')).trim(), line.slice(line.indexOf(':') + 1).trim());
			});
		[
			HEADER_CONTENT_ENCODING,
			HEADER_CONTENT_ENCRYPTION,
			HEADER_CONTENT_LENGTH,
			HEADER_CONTENT_SIGNATURE,
			HEADER_CONTENT_TYPE,
			HEADER_CREATED,
			HEADER_ORIGIN,
		].forEach((item) => {
			if (!headers.get(item)) {
				throw new Error(`missing header '${item}'`);
			}
		});

		return new this({
			ContentEncoding: headers.get(HEADER_CONTENT_ENCODING)!.toString(),
			ContentEncryption: headers.get(HEADER_CONTENT_ENCRYPTION)!.toString(),
			ContentLength: Number.parseInt(headers.get(HEADER_CONTENT_LENGTH)!.toString()!),
			ContentSignature: parseSignatureHeader(headers.get(HEADER_CONTENT_SIGNATURE)!.toString()),
			ContentType: headers.get(HEADER_CONTENT_TYPE)!.toString() as ContentType,
			Created: new Date(headers.get(HEADER_CREATED)!.toString()!),
			Origin: parseOriginHeader(headers.get(HEADER_ORIGIN)!.toString()),
		});
	}

	ToBuffer(): Buffer {
		const headers: string[] = [];
		headers.push(`${HEADER_CONTENT_ENCODING}: ${this.headers.ContentEncoding}`);
		headers.push(`${HEADER_CONTENT_ENCRYPTION}: ${this.headers.ContentEncryption}`);
		headers.push(`${HEADER_CONTENT_LENGTH}: ${this.headers.ContentLength}`);
		if (this.headers.ContentLocation) {
			headers.push(`${HEADER_CONTENT_LOCATION}: ${this.headers.ContentLocation}`);
		}
		headers.push(`Content-Signature: ${createSignatureHeader(this.headers.ContentSignature, this.headers.Origin)}`);
		headers.push(`Content-Type: ${this.headers.ContentType}`);
		headers.push(`Created: ${this.headers.Created.toISOString()}`);

		headers.push(`Origin: ${createOriginHeader(this.headers.Origin)}`);

		return Buffer.from(headers.join('\r\n'), 'utf8');
	}
}

function parseHeaderElements(input: string, requiredKeys: string[]): Map<String, String> {
	const invalidAttributes: string[] = [];
	const attributes = new Map<String, String>();
	input.split(';').forEach((item) => {
		const parts = item.split('=', 2);
		if (parts.length !== 2) {
			invalidAttributes.push(item);
		}
		attributes.set(parts[0].trim(), parts[1].trim());
	});

	requiredKeys.forEach((item) => {
		if (!attributes.get(item)) {
			throw new Error(`missing header attribute '${item}'`);
		}
	});

	return attributes;
}

function parseSignatureHeader(input: string): Uint8Array {
	const attributes = parseHeaderElements(input, ['data']);

	const sig = DecodeBase64(attributes.get('data')!.toString());

	if (sig.length === 0) {
		throw new Error('could not decode signature');
	}

	return sig;
}

function createSignatureHeader(signature: Uint8Array, signer: PublicKey): string {
	const values: string[] = [];
	values.push(`data=${EncodeBase64(signature)}`);
	values.push(`alg=${KindFromPublicKey(signer)}`);

	return values.join('; ').trimEnd();
}

function parseOriginHeader(input: string): PublicKey {
	const attributes = parseHeaderElements(input, ['data', 'alg']);
	const bytes = DecodeBase64(attributes.get('data')!.toString());

	return PublicKeyFromKind(attributes.get('alg')!.toString(), bytes);
}

function createOriginHeader(signer: PublicKey): string {
	const values: string[] = [];
	values.push(`data=${EncodeBase64(signer.bytes)}`);
	values.push(`alg=${KindFromPublicKey(signer)}`);

	return values.join('; ').trimEnd();
}
