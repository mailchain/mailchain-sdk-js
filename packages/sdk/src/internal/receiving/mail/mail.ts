import { KeyRingDecrypter } from '@mailchain/keyring';
import axios, { AxiosInstance } from 'axios';
import { Payload } from '../../transport';
import { PayloadReceiver } from '../payload';
import { Configuration } from '../../../';
import { ReadonlyMailerPayload } from '../../transport/mailer/payload';
import { MailerContentResolver } from '../mailer';
import { DeliveryRequests } from '../deliveryRequests';

export type ReadonlyMailPayload = ReadonlyMailerPayload | Payload;
export type ReceivedMail = ReceivedMailOk | ReceivedMailError;

export type ReceivedMailOk = {
	status: 'ok';
	payload: ReadonlyMailPayload;
	hash: Uint8Array;
};

export type ReceivedMailError = {
	status: 'error';
	cause: Error;
};

export class MailReceiver {
	constructor(
		private readonly deliveryRequests: DeliveryRequests,
		private readonly mailerReceiver: MailerContentResolver,
		private readonly payloadReceiver: PayloadReceiver,
	) {}

	static create(
		configuration: Configuration,
		receiverMessagingKeyDecrypter: KeyRingDecrypter,
		axiosInstance: AxiosInstance = axios.create(),
	) {
		return new MailReceiver(
			DeliveryRequests.create(configuration, receiverMessagingKeyDecrypter),
			MailerContentResolver.create(configuration, axiosInstance),
			PayloadReceiver.create(configuration, receiverMessagingKeyDecrypter),
		);
	}

	async confirmDelivery(hash: Uint8Array) {
		await this.deliveryRequests.confirmDelivery(hash);
	}

	async getUndelivered(): Promise<ReceivedMail[]> {
		const undeliveredPayloads = await this.payloadReceiver.getUndelivered();

		return Promise.all(
			undeliveredPayloads.map(async (result) => {
				switch (result.status) {
					case 'ok':
						return {
							status: 'ok',
							payload: await this.processReceivedPayload(result.payload),
							hash: result.hash,
						};
					case 'error-payload':
						return {
							status: 'error',
							cause: result.cause,
						};
					case 'error-delivery-request':
						return {
							status: 'error',
							cause: result.cause,
						};
					default:
						return {
							status: 'error',
							cause: new Error('unknown status'),
						};
				}
			}),
		);
	}

	async processReceivedPayload(payload: Payload): Promise<ReadonlyMailPayload> {
		switch (payload.Headers.ContentType) {
			case 'message/x.mailchain':
				return payload;
			case 'message/x.mailchain-mailer':
				return await this.mailerReceiver.get(payload);
			default:
				throw new Error(`Unsupported content type: ${payload.Headers.ContentType}`);
		}
	}
}