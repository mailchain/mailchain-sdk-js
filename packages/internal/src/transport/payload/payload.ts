import { ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { CHUNK_LENGTH_1MB, encryptPayload, serialize } from '../serialization';
import { SerializablePayloadHeadersImpl } from './headersSerialize';
import { PayloadHeaders } from './headers';

/**
 * Payload.
 */
export interface Payload<H extends PayloadHeaders = PayloadHeaders> {
	/**
	 * @see defaults to {@link PayloadHeaders}
	 */
	Headers: H;
	/**
	 * Raw/data/object that are decrypted and parsed base on the the headers.
	 */
	Content: Buffer;
}

export async function serializeAndEncryptPayload(
	payload: Payload,
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey,
) {
	const headers = new SerializablePayloadHeadersImpl().serialize(payload.Headers);
	return serialize(await encryptPayload(headers, payload.Content, payloadRootEncryptionKey, CHUNK_LENGTH_1MB));
}
