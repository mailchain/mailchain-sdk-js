import { PrivateKey } from '@mailchain/crypto';
import { PrivateKeyDecrypter } from '@mailchain/crypto/cipher/nacl/private-key-decrypter';
import { deriveHardenedKey } from '@mailchain/crypto/ed25519';
import { ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519/exprivate';
import { SerializablePayloadHeaders } from './headers';
import { EncryptedPayload, Payload } from './payload';

/**
 * Decrypt a payload
 *
 * @param input
 * @param payloadRootKey is used to derive a separate key for the headers and each part of the message
 * @returns
 */
export async function decryptPayload(
	input: EncryptedPayload,
	payloadRootKey: ED25519ExtendedPrivateKey,
): Promise<Payload> {
	const decryptedContentChunks = await decryptChunks(input.EncryptedContentChunks, payloadRootKey);

	const headersEncryptionKey = deriveHardenedKey(payloadRootKey, 'headers');
	const decryptedHeaders = await decryptBuffer(input.EncryptedHeaders, headersEncryptionKey.privateKey);

	const headers = SerializablePayloadHeaders.FromBuffer(decryptedHeaders);

	return {
		Headers: headers.headers,
		Content: Buffer.concat(decryptedContentChunks),
	};
}

/**
 * Decrypt each chunk with the key derived from payloadRootKey
 * @param chunks chunks of max 1mb to decrypt
 * @param payloadRootKey root key used to derive encryption keys for each chunk
 * @returns list of decrypted chunks
 */
export async function decryptChunks(chunks: Buffer[], payloadRootKey: ED25519ExtendedPrivateKey): Promise<Buffer[]> {
	const decryptedChunks = new Array<Buffer>(chunks.length);

	const contentRootKey = deriveHardenedKey(payloadRootKey, 'content');

	for (let i = 0; i < chunks.length; i++) {
		const chunkKey = deriveHardenedKey(contentRootKey, i);
		decryptedChunks[i] = await decryptBuffer(chunks[i], chunkKey.privateKey);
	}

	return decryptedChunks;
}

export async function decryptBuffer(buffer: Buffer, key: PrivateKey): Promise<Buffer> {
	if (buffer.length === 0) {
		throw new Error('can not decrypt empty data');
	}
	const decrypted = await PrivateKeyDecrypter.fromPrivateKey(key).Decrypt(buffer);
	return Buffer.from(decrypted);
}
