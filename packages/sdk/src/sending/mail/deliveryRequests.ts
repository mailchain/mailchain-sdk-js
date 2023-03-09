import { SignerWithPublicKey } from '@mailchain/crypto';
import flatten from 'lodash/flatten';
import { Configuration } from '../../configuration';
import { DeliveryRequests, SendPayloadDeliveryRequestResult } from '../deliveryRequests/deliveryRequests';
import { ResolvedAddress } from '../../messagingKeys';
import { FailedDistributionError, PreparedDistribution } from './payload';

export type SendResultFailedPrepare = {
	status: 'failed-prepare';
	failedDistributions: FailedDistributionError[];
};

export type SendResultFullyCompleted = {
	status: 'success';
	deliveries: SendPayloadDeliveryRequestResult[];
};

export type SendResultPartiallyCompleted = {
	status: 'partially-completed';
	successfulDeliveries: SendPayloadDeliveryRequestResult[];
	failedDeliveries: SendPayloadDeliveryRequestResult[];
};

export type SendResult = SendResultFailedPrepare | SendResultFullyCompleted | SendResultPartiallyCompleted;

export class MailDeliveryRequests {
	constructor(private readonly deliveryRequests: DeliveryRequests) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new MailDeliveryRequests(DeliveryRequests.create(configuration, sender));
	}

	/**
	 * Send the prepared payloads to each recipient.
	 * A single payload maybe be sent to multiple recipients in the case of multiple recipients.
	 * Separate payloads are sent to each recipient in the case of bcc recipients.
	 * @param successfulDistributions
	 * @param resolvedAddresses
	 * @returns
	 */
	async send(
		successfulDistributions: PreparedDistribution[],
		resolvedAddresses: Map<string, ResolvedAddress>,
	): Promise<SendResult> {
		// for each distribution, send the payload to the recipients

		const sendResults = await Promise.all(
			successfulDistributions.map(async (preparedDistribution) => {
				const recipients = preparedDistribution.distribution.recipients.map(
					({ address }) => resolvedAddresses.get(address)!.messagingKey,
				);

				return this.deliveryRequests.sendManyPayloadDeliveryRequests({
					recipients,
					...preparedDistribution.preparedPayload,
				});
			}),
		);

		const allSucceeded = sendResults.every((x) => x.status === 'success');
		if (allSucceeded) {
			return {
				status: 'success',
				deliveries: flatten(sendResults.map((x) => x.succeeded)),
			} as SendResultFullyCompleted;
		}
		return {
			status: 'partially-completed',
			failedDeliveries: flatten(sendResults.filter((x) => x.status === 'fail').map((x) => x.failed)),
			successfulDeliveries: flatten(sendResults.filter((x) => x.status === 'success').map((x) => x.succeeded)),
		};
	}
}
