import { ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { CHUNK_LENGTH_1MB, encryptPayload, serialize } from '../serialization';
import { PayloadHeaders, SerializableTransportPayloadHeaders } from './headers';

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

export async function serializeAndEncryptPayload(
	payload: Payload,
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey,
) {
	const headers = SerializableTransportPayloadHeaders.FromEncryptedPayloadHeaders(payload.Headers).ToBuffer();
	return serialize(await encryptPayload(headers, payload.Content, payloadRootEncryptionKey, CHUNK_LENGTH_1MB));
}
