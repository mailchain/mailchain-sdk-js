import { RandomFunction, secureRandom } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeHexZeroX } from '@mailchain/encoding';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { KeyRing } from '@mailchain/keyring';
import { protocol } from '../protobuf/protocol/protocol';
import { Configuration, PublicKey, TransportApiFactory } from '../api';
import { getPublicKeyFromApiResponse, lookupMessageKey } from '../identityKeys';
import { getAxiosWithSigner } from '../auth/jwt';
import { MailAddress } from '../formatters/types';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { Serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';

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

export type PayloadRecipientDelivery = SuccessPayloadRecipientDelivery | FailPayloadRecipientDelivery;
export type PayloadForRecipient = { recipient: MailAddress; payload: Payload };

export async function sendPayload(
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	payloads: PayloadForRecipient[],
	rand: RandomFunction = secureRandom,
): Promise<PayloadRecipientDelivery[]> {
	return Promise.all(payloads.map((payload) => sendPayloadInternal(keyRing, apiConfiguration, payload, rand)));
}

/**
 * Sends a message to multiple recipients
 */
async function sendPayloadInternal(
	keyRing: KeyRing,
	apiConfiguration: Configuration,
	{ payload, recipient }: PayloadForRecipient,
	rand: RandomFunction,
): Promise<PayloadRecipientDelivery> {
	const transportApi = TransportApiFactory(
		apiConfiguration,
		undefined,
		getAxiosWithSigner(keyRing.accountIdentityKey()),
	);

	// create root encryption key that will be used to encrypt message content.
	const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate(rand));

	const encryptedPayload = await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB, rand);
	const serializedContent = Serialize(encryptedPayload);

	const { uri: messageUri } = await transportApi.postEncryptedPayload(serializedContent).then((r) => r.data);

	const { messageKey } = await lookupMessageKey(apiConfiguration, recipient.address);
	const deliveryCreated = await createDelivery(
		getPublicKeyFromApiResponse(messageKey),
		payloadRootEncryptionKey,
		messageUri,
		rand,
	);
	const encodedDelivery = protocol.Delivery.encode(deliveryCreated).finish();
	try {
		const res = await transportApi.postDeliveryRequest({
			encryptedDeliveryRequest: EncodeBase64(encodedDelivery),
			recipientMessagingKey: EncodeHexZeroX(EncodePublicKey(getPublicKeyFromApiResponse(messageKey))),
		});
		return {
			status: 'success',
			recipient: messageKey,
			deliveryRequestId: res.data.deliveryRequestID,
		};
	} catch (e) {
		return {
			status: 'fail',
			cause: e as Error,
			recipient: messageKey,
		};
	}
}
