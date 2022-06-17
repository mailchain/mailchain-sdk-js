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

type SendPayloadResult = {
	deliveries: PayloadRecipientDelivery[];
};

type SuccessPayloadRecipientDelivery = {
	status: 'success';
	deliveryRequestId: string;
	recipient: PublicKey;
};

type FailPayloadRecipientDelivery = {
	status: 'fail';
	cause: Error;
	recipient: PublicKey;
};

type PayloadRecipientDelivery = SuccessPayloadRecipientDelivery | FailPayloadRecipientDelivery;

export const sendPayload = async (
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: string[],
	rand: RandomFunction = SecureRandom,
) => {
	const recipientKeys = await Promise.all(recipients.map((address) => lookupMessageKey(apiConfiguration, address)));
	return sendPayloadInternal(keyRing, apiConfiguration, payload, recipientKeys, rand);
};

/**
 * Sends a message to multiple recipients
 */
async function sendPayloadInternal(
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	payload: Payload,
	recipients: PublicKey[],
	rand: RandomFunction = SecureRandom,
): Promise<SendPayloadResult> {
	const transportApi = TransportApiFactory(
		apiConfiguration,
		undefined,
		getAxiosWithSigner(keyRing.accountIdentityKey()),
	);

	// create root encryption key that will be used to encrypt message content.
	const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.FromPrivateKey(ED25519PrivateKey.Generate(rand));

	const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
	const serializedContent = Serialize(encryptedPayload);

	const { uri: messageUri } = await transportApi.postEncryptedPayload(serializedContent).then((r) => r.data);

	const deliveries: PayloadRecipientDelivery[] = await Promise.all(
		recipients.map(async (messagingKey) => {
			const deliveryCreated = await createDelivery(
				getPublicKeyFromApiResponse(messagingKey),
				payloadRootEncryptionKey,
				messageUri,
				rand,
			);
			const encodedDelivery = protocol.Delivery.encode(deliveryCreated).finish();
			try {
				const res = await transportApi.postDeliveryRequest({
					encryptedDeliveryRequest: EncodeBase64(encodedDelivery),
					recipientMessagingKey: EncodeHexZeroX(EncodePublicKey(getPublicKeyFromApiResponse(messagingKey))),
				});
				return {
					status: 'success',
					recipient: messagingKey,
					deliveryRequestId: res.headers['deliveryRequestID'],
				};
			} catch (e) {
				return {
					status: 'fail',
					cause: e as Error,
					recipient: messagingKey,
				};
			}
		}),
	);
	return { deliveries };
}
