import { ED25519ExtendedPrivateKey } from '@mailchain/crypto';
import { decodeBase64 } from '@mailchain/encoding';
import axios, { AxiosInstance } from 'axios';
import { KeyRingDecrypter } from '@mailchain/keyring';
import { Payload } from '../../transport';
import { DeliveryRequests } from '../deliveryRequests';
import { Configuration } from '../../';
import { PayloadOriginVerifier } from '../../transport/payload/verifier';
import { deserialize, decryptPayload } from '../../transport/serialization';
import { SerializableTransportPayloadHeaders } from '../../transport/payload/headers';

export type ReceivedPayload = ReceivedPayloadOk | ReceivedPayloadError;

type ReceivedPayloadOk = {
	status: 'success';
	payload: Payload;
};

type ReceivedPayloadError = {
	status: 'failure';
	cause: Error;
};

export type UndeliveredPayload = UndeliveredPayloadOk | UndeliveredPayloadPayloadError | UndeliveredPayloadError;

export type UndeliveredPayloadOk = {
	status: 'success';
	payload: Payload;
	deliveryRequestHash: Uint8Array;
};

export type UndeliveredPayloadPayloadError = {
	status: 'error-payload';
	cause: Error;
	deliveryRequestHash: Uint8Array;
};

export type UndeliveredPayloadError = {
	status: 'error-delivery-request';
	cause: Error;
	deliveryRequestHash: Uint8Array;
};

export class PayloadReceiver {
	constructor(
		private readonly deliveryRequests: DeliveryRequests,
		private readonly payloadOriginVerifier: PayloadOriginVerifier,
		private readonly axiosInstance: AxiosInstance,
	) {}

	static create(
		configuration: Configuration,
		receiverMessagingKeyDecrypter: KeyRingDecrypter,
		axiosInstance: AxiosInstance = axios.create(),
	) {
		return new PayloadReceiver(
			DeliveryRequests.create(configuration, receiverMessagingKeyDecrypter),
			PayloadOriginVerifier.create(),
			axiosInstance,
		);
	}

	async getUndelivered(): Promise<UndeliveredPayload[]> {
		const deliveryRequests = await this.deliveryRequests.getUndelivered();

		return Promise.all(
			deliveryRequests.map(async (result) => {
				switch (result.status) {
					case 'success':
						const payloadResponse = await this.get(result.payloadRootEncryptionKey, result.payloadUri);
						return processReceivedPayload(payloadResponse, result.deliveryRequestHash);

					case 'failure':
						return {
							cause: result.cause,
							deliveryRequestHash: result.deliveryRequestHash,
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

			const { headers, content } = await decryptPayload(encryptedPayload, payloadRootEncryptionKey);

			const payload = {
				Headers: SerializableTransportPayloadHeaders.FromBuffer(headers).headers,
				Content: content,
			};

			await this.payloadOriginVerifier.verifyPayloadOrigin(payload);

			return {
				status: 'success',
				payload,
			};
		} catch (error) {
			return {
				status: 'failure',
				cause: error as Error,
			};
		}
	}
}

function processReceivedPayload(payloadResponse: ReceivedPayload, deliveryRequestHash: Uint8Array) {
	switch (payloadResponse.status) {
		case 'success':
			return {
				status: 'success',
				payload: payloadResponse.payload,
				deliveryRequestHash,
			} as UndeliveredPayloadOk;
		case 'failure':
			return {
				status: 'error-payload',
				cause: payloadResponse.cause,
				deliveryRequestHash,
			} as UndeliveredPayloadPayloadError;
		default:
			return {
				status: 'error-payload',
				cause: new Error('Unknown payload response status'),
				deliveryRequestHash,
			} as UndeliveredPayloadPayloadError;
	}
}
