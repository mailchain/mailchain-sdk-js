import { KeyRingDecrypter } from '@mailchain/keyring';
import axios, { AxiosInstance } from 'axios';
import { Payload } from '../../transport';
import { PayloadReceiver } from '../payload';
import { Configuration } from '../../';
import { ReadonlyMailerPayload } from '../../transport/mailer/payload';
import { MailerContentResolver } from '../mailer';
import { DeliveryRequests } from '../deliveryRequests';

export type ReadonlyMailPayload = ReadonlyMailerPayload | Payload;
export type ReceivedMail = ReceivedMailOk | ReceivedMailError;

/**
 * Success type for a mail that was received.
 */
export type ReceivedMailOk = {
	status: 'ok';
	/**
	 * Payload of the mail.
	 */
	payload: ReadonlyMailPayload;
	/**
	 * Hash of delivery request.
	 */
	deliveryRequestHash: Uint8Array;
};

/**
 * Error type for a mail that could not be received.
 */
export type ReceivedMailError = {
	status: 'error';
	/**
	 * Reason the mail could not be received.
	 */
	cause: Error;
};

/**
 * Receive mail from the Mailchain network.
 */
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
			PayloadReceiver.create(configuration, receiverMessagingKeyDecrypter, axiosInstance),
		);
	}

	/**
	 * Confirm the delivery of a mail has been completed.
	 * @param hash of the delivery request.
	 */
	async confirmDelivery(deliveryRequestHash: Uint8Array) {
		await this.deliveryRequests.confirmDelivery(deliveryRequestHash);
	}

	/**
	 * Get all undelivered mail.
	 * @returns the mail that has been received.
	 */
	async getUndelivered(): Promise<ReceivedMail[]> {
		const undeliveredPayloads = await this.payloadReceiver.getUndelivered();

		return Promise.all(
			undeliveredPayloads.map(async (result) => {
				switch (result.status) {
					case 'ok':
						return {
							status: 'ok',
							payload: await this.processReceivedPayload(result.payload),
							deliveryRequestHash: result.deliveryRequestHash,
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

	/**
	 * creates the mail content from the payload.
	 * @param payload the decrypted payload received from the network.
	 * @returns
	 */
	private async processReceivedPayload(payload: Payload): Promise<ReadonlyMailPayload> {
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
