import { ED25519ExtendedPrivateKey, SignerWithPublicKey, encodePublicKey, PublicKey } from '@mailchain/crypto';
import { encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import {
	TransportApiInterface,
	TransportApiFactory,
	getAxiosWithSigner,
	createAxiosConfiguration,
} from '@mailchain/api';
import { Configuration } from '../../configuration';
import { createDelivery } from '../../transport';
import { protocol } from '../../internal/protobuf/protocol/protocol';

export type SendPayloadDeliveryRequestResultSuccess = {
	status: 'success';
	deliveryRequestId: string;
	recipientMessageKey: PublicKey;
};

export type SendPayloadDeliveryRequestResultFailed = {
	status: 'fail';
	cause: Error;
	recipientMessageKey: PublicKey;
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type SendPayloadDeliveryRequestResult =
	| SendPayloadDeliveryRequestResultSuccess
	| SendPayloadDeliveryRequestResultFailed;

export type SendDeliveryRequestsForPayloadResult = {
	status: 'success' | 'fail' | 'partial-failure';
	succeeded: SendPayloadDeliveryRequestResult[];
	failed: SendPayloadDeliveryRequestResult[];
};

type SendPayloadDeliveryRequestParams = {
	recipientMessageKey: PublicKey;
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

type SendManyPayloadDeliveryRequests = {
	recipients: PublicKey[];
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export class DeliveryRequests {
	constructor(private readonly transportApi: TransportApiInterface) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new DeliveryRequests(
			TransportApiFactory(createAxiosConfiguration(configuration.apiPath), undefined, getAxiosWithSigner(sender)),
		);
	}

	/**
	 * Send the same payload delivery request to multiple recipients
	 * @param recipients
	 * @param payloadUri
	 * @param payloadRootEncryptionKey
	 * @returns
	 */
	async sendManyPayloadDeliveryRequests(
		params: SendManyPayloadDeliveryRequests,
	): Promise<SendDeliveryRequestsForPayloadResult> {
		const { recipients, payloadUri, payloadRootEncryptionKey } = params;

		const results = await Promise.all(
			recipients.map(async (recipientMessageKey) => {
				try {
					const deliveryRequestResult = await this.sendPayloadDeliveryRequest({
						recipientMessageKey,
						payloadUri,
						payloadRootEncryptionKey,
					} as SendPayloadDeliveryRequestParams);

					if (deliveryRequestResult.status === 'fail') {
						return {
							status: 'fail',
							cause: deliveryRequestResult.cause,
							recipientMessageKey,
							payloadUri,
							payloadRootEncryptionKey,
						};
					}

					return {
						status: 'success',
						deliveryRequestId: deliveryRequestResult.deliveryRequestId,
						recipientMessageKey,
					};
				} catch (e) {
					return {
						status: 'fail',
						cause: e as Error,
						recipientMessageKey,
						payloadUri,
						payloadRootEncryptionKey,
					};
				}
			}),
		);

		const succeeded = results.filter((result) => result.status === 'success');
		const failed = results.filter((result) => result.status === 'fail');

		return {
			failed,
			succeeded,
			// eslint-disable-next-line no-nested-ternary
			status: failed.length > 0 ? (succeeded.length > 0 ? 'partial-failure' : 'fail') : 'success',
		} as SendDeliveryRequestsForPayloadResult;
	}

	/**
	 * Create delivery request for the recipient of the message providing the key used to encrypt the payload.
	 *
	 * @param recipientMessageKey the key of the message
	 * @param messageUri the URL to get the message from
	 * @param payloadRootEncryptionKey the root ephemeral key used to encrypt the Payload
	 */
	async sendPayloadDeliveryRequest(
		params: SendPayloadDeliveryRequestParams,
	): Promise<SendPayloadDeliveryRequestResult> {
		const { recipientMessageKey, payloadRootEncryptionKey, payloadUri } = params;
		const deliveryCreated = await createDelivery(recipientMessageKey, payloadRootEncryptionKey, payloadUri);

		try {
			const { data } = await this.transportApi.postDeliveryRequest({
				encryptedDeliveryRequest: encodeBase64(protocol.Delivery.encode(deliveryCreated).finish()),
				recipientMessagingKey: encodeHexZeroX(encodePublicKey(recipientMessageKey)),
			});

			return { status: 'success', deliveryRequestId: data.deliveryRequestID, recipientMessageKey };
		} catch (e) {
			return {
				status: 'fail',
				cause: e as Error,
				recipientMessageKey,
				payloadUri,
				payloadRootEncryptionKey,
			};
		}
	}
}
