import { EncryptedContent, ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import { CHUNK_LENGTH_1MB, decryptPayload, encryptPayload, deserialize, serialize, Payload } from '../transport';

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
