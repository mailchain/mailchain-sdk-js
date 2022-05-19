import { PublicKey, RandomFunction, SecureRandom } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeHex } from '@mailchain/encoding';
import { protocol } from '../protobuf/protocol';
import { Configuration, TransportApi } from '../api';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { Serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';

export interface Recipient {
	/**
	 * key that is used for messaging
	 */
	messagingKey: PublicKey;
}

/**
 * Sends a message to multiple recipients
 */
export const sendPayload = async (
	payload: Payload,
	recipients: Recipient[],
	// senderIdentityKey: PrivateKey,
	rand: RandomFunction = SecureRandom,
) => {
	const api = new TransportApi(
		new Configuration({
			// basePath: staticConfig.url,
		}),
	);

	// const payload = await prepareMessage(subject, senderIdentityKey); TODO: move somewhere

	// create root encryption key that will be used to encrypt message content.
	const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.FromPrivateKey(ED25519PrivateKey.Generate(rand));

	// TODO: re-implement once API is completed
	const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
	const serializedContent = Serialize(encryptedPayload);

	const postMessageResponse = await api.postPayload(Array.from(serializedContent));
	// const now = new Date(Date.now());
	// expires: new Date(now.setMonth(now.getMonth() + 8)).toISOString(),
	// });

	const messageURI = postMessageResponse.headers['messageLocation'];

	const encodedDeliveries = Array<Uint8Array>(recipients.length);
	for (let i = 0; i < recipients.length; i++) {
		// TODO: decide key exchange
		const delivery = await createDelivery(
			recipients[i].messagingKey,
			payloadRootEncryptionKey,
			messageURI,
			rand,
		);
		const encodedDelivery = protocol.Delivery.encode(delivery).finish();
		// TODO: prepend encoding ID.
		encodedDeliveries[i] = encodedDelivery;
	}
	// TODO: more robust
	encodedDeliveries.forEach((value: Uint8Array, index: number) => {
		api.postDeliveryRequest({
			encryptedDeliveryRequest: EncodeBase64(value),
			recipientMessagingKey: EncodeHex(recipients[index].messagingKey.Bytes),
		});
	});
};
