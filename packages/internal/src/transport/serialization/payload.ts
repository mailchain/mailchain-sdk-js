/**
 * Encrypted payload.
 */
export interface EncryptedPayload {
	EncryptedHeaders: Buffer;

	EncryptedContentChunks: Buffer[];
}
