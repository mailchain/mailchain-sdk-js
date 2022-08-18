import { EncryptedContent, ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import { CHUNK_LENGTH_1MB } from '../transport/payload/content/chunk';
import { decryptPayload } from '../transport/payload/content/decrypt';
import { encryptPayload } from '../transport/payload/content/encrypt';
import { Payload } from '../transport/payload/content/payload';
import { deserialize, serialize } from '../transport/payload/content/serialization';

/**
 * Used for encryption and decryption of the full message content.
 */
export type MessageCrypto = {
	encrypt: (payload: Payload) => Promise<EncryptedContent>;
	decrypt: (content: EncryptedContent) => Promise<Payload>;
};

export function createMailchainMessageCrypto(keyRing: KeyRing): MessageCrypto {
	const inboxKey = ED25519ExtendedPrivateKey.fromPrivateKey(keyRing.rootInboxKey());

	const encrypt: MessageCrypto['encrypt'] = async (payload) => {
		const encryptedPayload = await encryptPayload(payload, inboxKey, CHUNK_LENGTH_1MB);
		const serializedContent = serialize(encryptedPayload);
		return new Uint8Array(serializedContent);
	};

	const decrypt: MessageCrypto['decrypt'] = async (serializedContent) => {
		const encryptedPayload = deserialize(Buffer.from(serializedContent));
		return decryptPayload(encryptedPayload, inboxKey);
	};

	return { encrypt, decrypt };
}
