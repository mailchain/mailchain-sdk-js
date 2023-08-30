import { ED25519ExtendedPrivateKey, SignerWithPublicKey, publicKeyToBytes, PublicKey } from '@mailchain/crypto';
import { encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import {
	TransportApiInterface,
	TransportApiFactory,
	getAxiosWithSigner,
	createAxiosConfiguration,
} from '@mailchain/api';
import { Configuration, MailchainResult, partitionMailchainResults } from '../../';
import { createDelivery } from '../../transport';
import { protocol } from '../../protobuf/protocol/protocol';

export class SomeDeliveryRequestsFailedError extends Error {
	constructor(
		public readonly successes: Array<{
			params: SendDeliveryRequestParams;
			data: SentPayloadDistributionRequest;
		}>,
		public readonly failures: Array<{
			params: SendDeliveryRequestParams;
			error: SendDeliveryRequestError;
		}>,
	) {
		super(
			`Not all delivery requests were successfully sent. Check the failed delivery requests to retry failed requests.`,
		);
	}
}
export type SendManyDeliveryRequestError = SomeDeliveryRequestsFailedError;
export type SentManyDeliveryRequests = SentPayloadDistributionRequest[];

export type SendManyDeliveryRequestsParams = {
	recipients: PublicKey[];
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

type SendDeliveryRequestParams = {
	recipientMessageKey: PublicKey;
	payloadUri: string;
	payloadRootEncryptionKey: ED25519ExtendedPrivateKey;
};

export type SentPayloadDistributionRequest = {
	deliveryRequestId: string;
	recipientMessageKey: PublicKey;
};
export type SendDeliveryRequestError = SendDeliveryRequestTransportError;
export class SendDeliveryRequestTransportError extends Error {
	constructor(cause: Error, readonly params: SendDeliveryRequestParams) {
		super('failed sending delivery request', { cause });
	}
}

export class DeliveryRequests {
	constructor(private readonly transportApi: TransportApiInterface) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new DeliveryRequests(
			TransportApiFactory(createAxiosConfiguration(configuration.apiPath), undefined, getAxiosWithSigner(sender)),
		);
	}

	/**
	 * Send the same payload delivery request to multiple recipients
	 */
	async sendManyDeliveryRequests(
		params: SendManyDeliveryRequestsParams,
	): Promise<MailchainResult<SentManyDeliveryRequests, SendManyDeliveryRequestError>> {
		const { recipients, payloadUri, payloadRootEncryptionKey } = params;

		const results = await Promise.all(
			recipients.map(async (recipientMessageKey) => {
				const sendDeliveryRequestParams = {
					recipientMessageKey,
					payloadUri,
					payloadRootEncryptionKey,
				} as SendDeliveryRequestParams;
				const result = await this.sendDeliveryRequest(sendDeliveryRequestParams);
				return { result, params: sendDeliveryRequestParams };
			}),
		);

		const { successes: sent, failures: failed } = partitionMailchainResults(results);

		if (failed.length > 0) {
			return {
				error: new SomeDeliveryRequestsFailedError(sent, failed),
			};
		}

		return {
			data: sent.map((s) => s.data),
		};
	}

	/**
	 * Create delivery request for the recipient of the message providing the key used to encrypt the payload.
	 *
	 * @param recipientMessageKey the key of the message
	 * @param messageUri the URL to get the message from
	 * @param payloadRootEncryptionKey the root ephemeral key used to encrypt the Payload
	 */
	async sendDeliveryRequest(
		params: SendDeliveryRequestParams,
	): Promise<MailchainResult<SentPayloadDistributionRequest, SendDeliveryRequestError>> {
		const { recipientMessageKey, payloadRootEncryptionKey, payloadUri } = params;
		const deliveryCreated = await createDelivery(recipientMessageKey, payloadRootEncryptionKey, payloadUri);

		try {
			const { deliveryRequestID: deliveryRequestId } = await this.transportApi
				.postDeliveryRequest({
					encryptedDeliveryRequest: encodeBase64(protocol.Delivery.encode(deliveryCreated).finish()),
					recipientMessagingKey: encodeHexZeroX(publicKeyToBytes(recipientMessageKey)),
				})
				.then((response) => response.data);

			return { data: { deliveryRequestId, recipientMessageKey } };
		} catch (e) {
			return {
				error: new SendDeliveryRequestTransportError(e as Error, params),
			};
		}
	}
}
