import { ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { decodeBase64 } from '@mailchain/encoding';
import axios, { AxiosInstance } from 'axios';
import { KeyRingDecrypter } from '@mailchain/keyring';
import { decryptPayload, deserialize, Payload } from '../../transport';
import { DeliveryRequests, UndeliveredDeliveryRequestSuccess } from '../deliveryRequests';
import { Configuration } from '../../../';
import { PayloadOriginVerifier } from '../../transport/payload/verifier';

export type ReceivedPayload = ReceivedPayloadOk | ReceivedPayloadError;

type ReceivedPayloadOk = {
	status: 'ok';
	payload: Payload;
};

type ReceivedPayloadError = {
	status: 'error';
	cause: Error;
};

export type UndeliveredPayload = UndeliveredPayloadOk | UndeliveredPayloadPayloadError | UndeliveredPayloadError;

export type UndeliveredPayloadOk = {
	status: 'ok';
	payload: Payload;
	hash: Uint8Array;
};

export type UndeliveredPayloadPayloadError = {
	status: 'error-payload';
	cause: Error;
	hash: Uint8Array;
};

export type UndeliveredPayloadError = {
	status: 'error-delivery-request';
	cause: Error;
	hash: Uint8Array;
};

export class PayloadReceiver {
	constructor(
		private readonly axiosInstance: AxiosInstance,
		private readonly deliveryRequests: DeliveryRequests,
		private readonly payloadOriginVerifier: PayloadOriginVerifier,
	) {}

	static create(configuration: Configuration, receiverMessagingKeyDecrypter: KeyRingDecrypter) {
		return new PayloadReceiver(
			axios.create(),
			DeliveryRequests.create(configuration, receiverMessagingKeyDecrypter),
			PayloadOriginVerifier.create(),
		);
	}

	async getUndelivered(): Promise<UndeliveredPayload[]> {
		const deliveryRequests = await this.deliveryRequests.getUndelivered();

		return Promise.all(
			deliveryRequests.map(async (result) => {
				switch (result.status) {
					case 'ok':
						const payloadResponse = await this.get(result.payloadRootEncryptionKey, result.payloadUri);
						return processReceivedPayload(payloadResponse, result);

					case 'error':
						return {
							cause: result.cause,
							hash: result.hash,
							status: 'error-delivery-request',
						} as UndeliveredPayloadError;
				}
			}),
		);
	}

	async get(payloadRootEncryptionKey: ED25519ExtendedPrivateKey, payloadUri: string): Promise<ReceivedPayload> {
		try {
			const encryptedMessageBodyResponse = await this.axiosInstance.get(payloadUri, {
				responseType: 'arraybuffer',
			});

			const encryptedMessageBody = Buffer.from(decodeBase64(encryptedMessageBodyResponse.data));

			const encryptedPayload = deserialize(encryptedMessageBody);

			const payload = await decryptPayload(encryptedPayload, payloadRootEncryptionKey);

			await this.payloadOriginVerifier.verifyPayloadOrigin(payload);

			return {
				status: 'ok',
				payload,
			};
		} catch (error) {
			return {
				status: 'error',
				cause: error as Error,
			};
		}
	}
}

function processReceivedPayload(payloadResponse: ReceivedPayload, result: UndeliveredDeliveryRequestSuccess) {
	switch (payloadResponse.status) {
		case 'ok':
			return {
				status: 'ok',
				payload: payloadResponse.payload,
				hash: result.hash,
			} as UndeliveredPayloadOk;
		case 'error':
			return {
				status: 'error-payload',
				cause: payloadResponse.cause,
				hash: result.hash,
			} as UndeliveredPayloadPayloadError;
		default:
			return {
				status: 'error-payload',
				cause: new Error('Unknown payload response status'),
				hash: result.hash,
			} as UndeliveredPayloadPayloadError;
	}
}
