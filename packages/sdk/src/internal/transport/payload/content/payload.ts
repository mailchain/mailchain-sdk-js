import { PayloadHeaders } from './headers';

/**
 * Payload.
 */
export interface Payload {
	/**
	 * @see PayloadHeaders
	 */
	Headers: PayloadHeaders;
	/**
	 * Raw/data/object that are decrypted and parsed base on the the headers.
	 */
	Content: Buffer;
}

/**
 * Encrypted payload.
 */
export interface EncryptedPayload {
	EncryptedHeaders: Buffer;

	EncryptedContentChunks: Buffer[];
}
