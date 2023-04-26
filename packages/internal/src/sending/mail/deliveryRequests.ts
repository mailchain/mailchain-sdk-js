import { SignerWithPublicKey } from '@mailchain/crypto';
import flatten from 'lodash/flatten';
import { Configuration, MailchainResult, partitionMailchainResults } from '../..';
import {
	DeliveryRequests,
	SentManyDeliveryRequests,
	SentDeliveryRequest,
	SomeDeliveryRequestsFailedError,
	SendManyDeliveryRequestsParams,
} from '../deliveryRequests/deliveryRequests';
import { ResolvedAddress } from '../../messagingKeys';
import { PreparedDistribution } from './payloadSender';

export type SentMailDeliveryRequests = SentDeliveryRequest[];
export type SendMailDeliveryRequestsError = SomeMailDeliveryRequestsFailedError;

export class SomeMailDeliveryRequestsFailedError extends Error {
	readonly type = 'send_mail_delivery_request_failures';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#send_mail_delivery_request_failures';
	constructor(
		public readonly successes: Array<{
			params: SendManyDeliveryRequestsParams;
			data: SentManyDeliveryRequests;
		}>,
		public readonly failures: Array<{
			params: SendManyDeliveryRequestsParams;
			error: SomeDeliveryRequestsFailedError;
		}>,
	) {
		super(
			`Not all mail delivery requests were successfully sent. Check the failed delivery requests to retry failed requests.`,
		);
	}
}

export type SendMailDeliveryRequestsParams = {
	distributions: PreparedDistribution[];
	resolvedAddresses: Map<string, ResolvedAddress>;
};
export class MailDeliveryRequests {
	constructor(private readonly deliveryRequests: DeliveryRequests) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new MailDeliveryRequests(DeliveryRequests.create(configuration, sender));
	}

	/**
	 * Send the prepared payloads to each recipient.
	 * A single payload maybe be sent to multiple recipients in the case of multiple recipients.
	 * Separate payloads are sent to each recipient in the case of bcc recipients.
	 */
	async sendMailDeliveryRequests(
		params: SendMailDeliveryRequestsParams,
	): Promise<MailchainResult<SentMailDeliveryRequests, SendMailDeliveryRequestsError>> {
		const { distributions, resolvedAddresses } = params;
		// for each distribution, send the payload to the recipients
		const sendResults = await Promise.all(
			distributions.map(async (preparedDistribution) => {
				const recipients = preparedDistribution.distribution.recipients.map(
					({ address }) => resolvedAddresses.get(address)!.messagingKey,
				);
				const sendManyDeliveryRequestsParams = {
					recipients,
					...preparedDistribution.preparedPayload,
				};
				const result = await this.deliveryRequests.sendManyDeliveryRequests(sendManyDeliveryRequestsParams);

				return {
					result,
					params: sendManyDeliveryRequestsParams,
				};
			}),
		);

		const { successes: successfulDeliveries, failures: failed } = partitionMailchainResults(sendResults);
		if (failed.length > 0) {
			return { error: new SomeMailDeliveryRequestsFailedError(successfulDeliveries, failed) };
		}

		return {
			data: flatten(successfulDeliveries.map(({ data }) => data)),
		};
	}
}
