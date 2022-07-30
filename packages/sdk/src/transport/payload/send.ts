import { SignerWithPublicKey } from '@mailchain/crypto';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { protocol } from '../../protobuf/protocol/protocol';
import { Configuration, PublicKey, TransportApiInterface, TransportApiFactory } from '../../api';
import { getPublicKeyFromApiResponse, Lookup } from '../../identityKeys';
import { getAxiosWithSigner } from '../../auth/jwt';
import { CHUNK_LENGTH_1MB } from './content/chunk';
import { encryptPayload } from './content/encrypt';
import { Payload } from './content/payload';
import { serialize } from './content/serialization';
import { createDelivery } from './delivery/delivery';

export type PreparePayloadResult = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type PreparePayloadParams = {
	payload: Payload;
};

export type SendPayloadParams = {
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
	recipients: PublicKey[];
};

type SendPayloadDeliveryResultSuccess = {
	status: 'success';
	deliveryRequestId: string;
	recipient: PublicKey;
};

type SendPayloadDeliveryResultFailed = {
	status: 'fail';
	cause: Error;
	recipient: PublicKey;
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type SendPayloadDeliveryResult = SendPayloadDeliveryResultSuccess | SendPayloadDeliveryResultFailed;

export class PayloadSender {
	constructor(private readonly transportApi: TransportApiInterface) {}

	static create(configuration: Configuration, accountKeySigner: SignerWithPublicKey) {
		return new PayloadSender(TransportApiFactory(configuration, undefined, getAxiosWithSigner(accountKeySigner)));
	}

	async send(params: SendPayloadParams): Promise<SendPayloadDeliveryResult[]> {
		const deliveryResults: SendPayloadDeliveryResult[] = [];

		try {
			const results: SendPayloadDeliveryResult[] = await Promise.all(
				params.recipients.map(async (recipient) => {
					try {
						const deliveryRequestId = await this.postDeliveryRequest(
							recipient,
							params.payloadUri,
							params.payloadRootEncryptionKey,
						);
						return { status: 'success', deliveryRequestId, recipient };
					} catch (e) {
						return {
							status: 'fail',
							cause: e as Error,
							recipient,
							payloadUri: params.payloadUri,
							payloadRootEncryptionKey: params.payloadRootEncryptionKey,
						};
					}
				}),
			);
			deliveryResults.push(...results);
		} catch (e) {
			params.recipients.forEach((r) =>
				deliveryResults.push({
					status: 'fail',
					cause: e as Error,
					recipient: r,
					payloadUri: params.payloadUri,
					payloadRootEncryptionKey: params.payloadRootEncryptionKey,
				}),
			);
		}

		return deliveryResults;
	}

	/**
	 * Encrypt the payload with ephemeral key and deliver it to the storage nodes.
	 * @returns the URL to get the message from the and ephemeral key used for the encryption of it
	 */
	async prepare(payload: Payload): Promise<PreparePayloadResult> {
		// create root encryption key that will be used to encrypt message content.
		const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate());
		const serializedContent = serialize(await encryptPayload(payload, payloadRootEncryptionKey, CHUNK_LENGTH_1MB));

		const { uri: payloadUri } = await this.transportApi.postEncryptedPayload(serializedContent).then((r) => r.data);

		return {
			payloadUri,
			payloadRootEncryptionKey,
		};
	}

	/**
	 * Create delivery request for the recipient of the message providing the key used to encrypt the payload.
	 *
	 * @param recipientMessageKey the key of the message
	 * @param messageUri the URL to get the message from
	 * @param payloadRootEncryptionKey the root ephemeral key used to encrypt the Payload
	 */
	private async postDeliveryRequest(
		recipientMessageKey: PublicKey,
		messageUri: string,
		payloadRootEncryptionKey: ED25519ExtendedPrivateKey,
	): Promise<string> {
		const deliveryCreated = await createDelivery(
			getPublicKeyFromApiResponse(recipientMessageKey),
			payloadRootEncryptionKey,
			messageUri,
		);

		const res = await this.transportApi.postDeliveryRequest({
			encryptedDeliveryRequest: encodeBase64(protocol.Delivery.encode(deliveryCreated).finish()),
			recipientMessagingKey: encodeHexZeroX(encodePublicKey(getPublicKeyFromApiResponse(recipientMessageKey))),
		});
		return res.data.deliveryRequestID;
	}
}
