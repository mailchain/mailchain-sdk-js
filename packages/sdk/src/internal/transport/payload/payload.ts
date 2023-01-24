import { ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { CHUNK_LENGTH_1MB } from './chunk';
import { encryptPayload } from './encrypt';
import { PayloadHeaders } from './headers';
import { serialize } from './serialization';

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

export async function serializeAndEncryptPayload(
	payload: Payload,
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey,
) {
	return serialize(await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB));
}
