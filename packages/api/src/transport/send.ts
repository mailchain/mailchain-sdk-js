import { RandomFunction, SecureRandom } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeHexZeroX } from '@mailchain/encoding';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { KeyRing } from '@mailchain/keyring';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration, PublicKey, TransportApiFactory } from '../api';
import { getPublicKeyFromApiResponse, lookupMessageKey } from '../identityKeys';
import { getAxiosWithSigner } from '../auth/jwt';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { Serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';

export type Recipient = {
	address: string;
	protocol: string;
};

export const sendPayload = async (
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: Recipient[],
	rand: RandomFunction = SecureRandom,
) => {
	const recipientKeys = await Promise.all(recipients.map((r) => lookupMessageKey(apiConfiguration, r.address)));
	return sendPayloadInternal(keyRing, apiConfiguration, payload, recipientKeys, rand);
};

/**
 * Sends a message to multiple recipients
 */
const sendPayloadInternal = async (
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: PublicKey[],
	rand: RandomFunction = SecureRandom,
) => {
	const transportApi = TransportApiFactory(
		apiConfiguration,
		undefined,
		getAxiosWithSigner(keyRing.accountIdentityKey()),
	);

	// create root encryption key that will be used to encrypt message content.
	const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.FromPrivateKey(ED25519PrivateKey.Generate(rand));

	const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
	const serializedContent = Serialize(encryptedPayload);

	const postMessageResponse = await transportApi.postPayload(serializedContent);

	return Promise.all(
		recipients.map(async (messagingKey) => {
			const deliveryCreated = await createDelivery(
				getPublicKeyFromApiResponse(messagingKey),
				payloadRootEncryptionKey,
				postMessageResponse.data.uri,
				rand,
			);
			const encodedDelivery = protocol.Delivery.encode(deliveryCreated).finish();
			return await transportApi
				.postDeliveryRequest({
					encryptedDeliveryRequest: EncodeBase64(encodedDelivery),
					recipientMessagingKey: EncodeHexZeroX(EncodePublicKey(getPublicKeyFromApiResponse(messagingKey))),
				})
				.catch((err) => ({
					status: 'error',
					err,
				}));
		}),
	);
};
