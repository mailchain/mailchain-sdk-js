import { KeyRingDecrypter } from '@mailchain/keyring';
import axios, { AxiosInstance } from 'axios';
import { Payload } from '../../transport';
import { PayloadReceiver, UndeliveredPayloadOk } from '../payload';
import { Configuration } from '../../configuration';
import { ReadonlyMailerPayload } from '../../transport/mailer/payload';
import { MailerContentResolver } from '../mailer';
import { DeliveryRequests } from '../deliveryRequests';

export type ReadonlyMailPayload = ReadonlyMailerPayload | Payload;
export type ReceivedMail = ReceivedMailOk | ReceivedMailError;

/**
 * Success type for a mail that was received.
 */
export type ReceivedMailOk = {
	status: 'success';
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
	status: 'failure';
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
			undeliveredPayloads.map<Promise<ReceivedMail>>(async (undeliveredPayload) => {
				switch (undeliveredPayload.status) {
					case 'success':
						return this.processReceivedPayload(undeliveredPayload);
					case 'error-payload':
					case 'error-delivery-request':
						return {
							status: 'failure',
							cause: undeliveredPayload.cause,
						};
					default:
						return {
							status: 'failure',
							cause: new Error('failed processing received payload, unknown status'),
						};
				}
			}),
		);
	}

	private async processReceivedPayload(undeliveredPayload: UndeliveredPayloadOk): Promise<ReceivedMail> {
		try {
			return {
				status: 'success',
				payload: await this.processReceivedPayloadData(undeliveredPayload.payload),
				deliveryRequestHash: undeliveredPayload.deliveryRequestHash,
			};
		} catch (e) {
			return { status: 'failure', cause: new Error('failed processing received payload', { cause: e }) };
		}
	}

	/**
	 * creates the mail content from the payload.
	 * @param payload the decrypted payload received from the network.
	 * @returns
	 */
	private async processReceivedPayloadData(payload: Payload): Promise<ReadonlyMailPayload> {
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
