import { PrivateKey, ED25519ExtendedPrivateKey, PrivateKeyDecrypter, deriveHardenedKey } from '@mailchain/crypto';
import { EncryptedPayload } from '../serialization/payload';

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
): Promise<{ headers: Buffer; content: Buffer }> {
	const decryptedContentChunks = await decryptChunks(input.EncryptedContentChunks, payloadRootKey);

	const headersEncryptionKey = deriveHardenedKey(payloadRootKey, 'headers');
	const decryptedHeaders = await decryptBuffer(input.EncryptedHeaders, headersEncryptionKey.privateKey);

	return {
		headers: decryptedHeaders,
		content: Buffer.concat(decryptedContentChunks),
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
	const decrypted = await PrivateKeyDecrypter.fromPrivateKey(key).decrypt(buffer);
	return Buffer.from(decrypted);
}
