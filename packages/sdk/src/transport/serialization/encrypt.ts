import {
	PrivateKey,
	RandomFunction,
	secureRandom,
	deriveHardenedKey,
	PrivateKeyEncrypter,
	ED25519ExtendedPrivateKey,
} from '@mailchain/crypto';
import { EncryptedPayload } from '../serialization/payload';
import { chunkBuffer, CHUNK_LENGTH_1MB } from './chunk';

/**
 * Encrypts a payload
 *
 * @param input
 * @param payloadRootKey is used to derive a separate key for the headers and each part of the message
 * @param chunkSize approx 1mb
 * @returns
 */
export async function encryptPayload(
	headers: Buffer,
	content: Buffer,
	payloadRootKey: ED25519ExtendedPrivateKey,
	chunkSize: number = CHUNK_LENGTH_1MB,
	rand: RandomFunction = secureRandom,
): Promise<EncryptedPayload> {
	const chunks = chunkBuffer(content, chunkSize);
	const encryptedContentChunks = await encryptChunks(chunks, payloadRootKey, rand);

	const headersEncryptionKey = deriveHardenedKey(payloadRootKey, 'headers');
	const encryptedHeaders = await encryptBuffer(headers, headersEncryptionKey.privateKey, rand);

	return {
		EncryptedHeaders: encryptedHeaders,
		EncryptedContentChunks: encryptedContentChunks,
	};
}

/**
 * Encrypts each chunk with a different key derived from payloadRootKey
 * @param chunks chunks of max 1mb to encrypt
 * @param payloadRootKey root key used to derive encryption keys for each chunk
 * @returns list of encrypted chunks
 */
export async function encryptChunks(
	chunks: Buffer[],
	payloadRootKey: ED25519ExtendedPrivateKey,
	rand: RandomFunction = secureRandom,
): Promise<Buffer[]> {
	const encryptedChunks = new Array<Buffer>(chunks.length);

	const contentRootKey = deriveHardenedKey(payloadRootKey, 'content');
	for (let i = 0; i < chunks.length; i++) {
		const chunkKey = deriveHardenedKey(contentRootKey, i);
		encryptedChunks[i] = await encryptBuffer(chunks[i], chunkKey.privateKey, rand);
	}

	return encryptedChunks;
}

export async function encryptBuffer(
	buffer: Buffer,
	key: PrivateKey,
	rand: RandomFunction = secureRandom,
): Promise<Buffer> {
	const encrypted = await PrivateKeyEncrypter.fromPrivateKey(key, rand).encrypt(buffer);
	return Buffer.from(encrypted);
}
