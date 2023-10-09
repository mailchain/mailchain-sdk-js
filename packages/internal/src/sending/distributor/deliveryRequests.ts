import { SignerWithPublicKey } from '@mailchain/crypto';
import flatten from 'lodash/flatten';
import { Configuration } from '../../configuration';
import { MailchainResult, partitionMailchainResults } from '../../mailchainResult';
import {
	DeliveryRequests,
	SentManyDeliveryRequests,
	SentPayloadDistributionRequest,
	SomeDeliveryRequestsFailedError,
	SendManyDeliveryRequestsParams,
} from '../deliveryRequests';
import { ResolvedAddress } from '../../messagingKeys';
import { DistributionRequest } from './distributor';

export type SentPayloadDistributionRequests = SentPayloadDistributionRequest[];
export type SendPayloadDistributionRequestsError = SendPayloadDistributionRequestsFailuresError;

export class SendPayloadDistributionRequestsFailuresError extends Error {
	readonly type = 'send_payload_distribution_request_failures';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#send_payload_distribution_request_failures';
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

export type SendPayloadDistributionRequestsParams = {
	distributionRequests: DistributionRequest[];
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export class PayloadDeliveryRequests {
	constructor(private readonly deliveryRequests: DeliveryRequests) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new PayloadDeliveryRequests(DeliveryRequests.create(configuration, sender));
	}

	/**
	 * Send the prepared payloads to each recipient.
	 * A single payload maybe be sent to multiple recipients in the case of multiple recipients.
	 */
	async sendPayloadDistributionRequests(
		params: SendPayloadDistributionRequestsParams,
	): Promise<MailchainResult<SentPayloadDistributionRequests, SendPayloadDistributionRequestsError>> {
		const { distributionRequests, resolvedAddresses } = params;
		// for each distribution, send the payload to the recipients
		const sendResults = await Promise.all(
			distributionRequests.map(async (distributionRequest) => {
				const recipients = distributionRequest.distribution.recipients.map(
					(address) => resolvedAddresses.get(address)!.messagingKey,
				);
				const sendManyDeliveryRequestsParams = {
					recipients,
					...distributionRequest.storedPayload,
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
			return { error: new SendPayloadDistributionRequestsFailuresError(successfulDeliveries, failed) };
		}

		return {
			data: flatten(successfulDeliveries.map(({ data }) => data)),
		};
	}
}
