import { RandomFunction, SecureRandom } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeHex } from '@mailchain/encoding';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration, PublicKey, TransportApi } from '../api';
import { getPublicKeyFromApiResponse, lookupMessageKey } from '../identityKeys';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { Serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';

interface RecipientByKey {
	/**
	 * key that is used for messaging
	 */
	messagingKey: PublicKey;
}

interface RecipientByAddress {
	/**
	 * key that is used for messaging
	 */
	address: string;
	protocol: string;
}

export type Recipient = RecipientByKey | RecipientByAddress;
export const sendPayload = async (
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: Recipient[],
	// senderIdentityKey: PrivateKey,
	rand: RandomFunction = SecureRandom,
) => {
	const recipientsList: RecipientByKey[] = (
		await Promise.all(
			recipients.map((r) => {
				return 'address' in r ? lookupMessageKey(apiConfiguration, r.address) : r.messagingKey;
			}),
		)
	).map<RecipientByKey>((messagingKey) => ({ messagingKey: messagingKey as PublicKey }));

	return sendPayloadInternal(apiConfiguration, payload, recipientsList, rand);
};

/**
 * Sends a message to multiple recipients
 */
const sendPayloadInternal = async (
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: RecipientByKey[],
	// senderIdentityKey: PrivateKey,
	rand: RandomFunction = SecureRandom,
) => {
	const api = new TransportApi(apiConfiguration);

	// const payload = await prepareMessage(subject, senderIdentityKey); TODO: move somewhere

	// create root encryption key that will be used to encrypt message content.
	const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.FromPrivateKey(ED25519PrivateKey.Generate(rand));

	// TODO: re-implement once API is completed
	const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
	const serializedContent = Serialize(encryptedPayload);

	const postMessageResponse = await api.postPayload(Array.from(serializedContent));

	const messageURI = postMessageResponse.headers['location'];
	if (!messageURI) throw new Error();
	return Promise.all(
		recipients.map(({ messagingKey }) => {
			return createDelivery(
				getPublicKeyFromApiResponse(messagingKey),
				payloadRootEncryptionKey,
				messageURI,
				rand,
			).then(async (deliveryCreated) => {
				// TODO: prepend messaging key ID.

				const encodedDelivery = protocol.Delivery.encode(deliveryCreated).finish();

				await api
					.postDeliveryRequest({
						encryptedDeliveryRequest: EncodeBase64(encodedDelivery),
						recipientMessagingKey: EncodeHex(EncodePublicKey(getPublicKeyFromApiResponse(messagingKey))),
					})
					.catch((err) => ({
						status: 'error',
						err,
					}));
				return deliveryCreated;
			});
		}),
	);
};
