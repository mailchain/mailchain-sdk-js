import { EncryptedContent, ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import {
	deserialize,
	serialize,
	CHUNK_LENGTH_1MB,
	decryptPayload,
	encryptPayload,
} from '../../transport/serialization';
import { SerializableMailPayloadHeaders } from './payload/headers';
import { MailPayload } from './payload/payload';

/**
 * Used for encryption and decryption of the full message content.
 */
export type MessageCrypto = {
	encrypt: (payload: MailPayload) => Promise<EncryptedContent>;
	decrypt: (content: EncryptedContent) => Promise<MailPayload>;
};

export function createMailchainMessageCrypto(keyRing: KeyRing): MessageCrypto {
	const inboxKey = ED25519ExtendedPrivateKey.fromPrivateKey(keyRing.rootInboxKey());

	const encrypt: MessageCrypto['encrypt'] = async (payload) => {
		const headers = SerializableMailPayloadHeaders.FromEncryptedMailPayloadHeaders(payload.Headers).ToBuffer();
		const encryptedPayload = await encryptPayload(headers, payload.Content, inboxKey, CHUNK_LENGTH_1MB);
		const serializedContent = serialize(encryptedPayload);
		return new Uint8Array(serializedContent);
	};

	const decrypt: MessageCrypto['decrypt'] = async (serializedContent) => {
		const encryptedPayload = deserialize(Buffer.from(serializedContent));
		const { headers, content } = await decryptPayload(encryptedPayload, inboxKey);

		return {
			Content: content,
			Headers: SerializableMailPayloadHeaders.FromBuffer(headers).headers,
		};
	};

	return { encrypt, decrypt };
}
