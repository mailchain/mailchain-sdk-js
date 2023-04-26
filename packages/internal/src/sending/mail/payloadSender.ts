import { SignerWithPublicKey } from '@mailchain/crypto';
import { createAxiosConfiguration } from '@mailchain/api';
import { Configuration, MailchainResult, partitionMailchainResults } from '../../';
import { PayloadSender, SentPayload } from '../payload/send';
import { MailDistribution } from '../../transport/mail/distribution';

export class SomePrepareDistributionError extends Error {
	readonly type = 'prepare_distributions_failures';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#prepare_distributions_failures';
	constructor(
		public readonly successes: Array<{
			params: PrepareDistributionParams;
			data: PreparedDistribution;
		}>,
		public readonly failures: Array<{
			params: PrepareDistributionParams;
			error: PayloadSendingError;
		}>,
	) {
		super(`Not all distributions prepared correctly. Check the failed distributions to retry failed requests.`);
	}
}

export type PrepareDistributionsError = SomePrepareDistributionError;

export class PayloadSendingError extends Error {
	readonly type = 'payload_sending_error';
	constructor(readonly distribution: MailDistribution, readonly cause: Error) {
		super('Payload could not be sent.');
	}
}

export type PrepareDistributionParams = MailDistribution;
export type PreparedDistribution = {
	distribution: MailDistribution;
	preparedPayload: SentPayload;
};

export type PreparedDistributions = PreparedDistribution[];

export class MailPayloadSender {
	constructor(private readonly payloadSender: PayloadSender) {}

	static create(configuration: Configuration, signer: SignerWithPublicKey) {
		return new MailPayloadSender(PayloadSender.create(createAxiosConfiguration(configuration.apiPath), signer));
	}

	/**
	 * Prepare payloads, update each distribution to the storage layer
	 * @param distributions payloads for each recipient
	 * @returns
	 */
	async prepareDistributions(
		distributions: MailDistribution[],
	): Promise<MailchainResult<PreparedDistributions, PrepareDistributionsError>> {
		const preparedDistributions = await Promise.all(
			distributions.map(async (distribution) => {
				const result = await this.prepareDistribution(distribution);

				return { result, params: distribution };
			}),
		);

		const { successes, failures } = partitionMailchainResults(preparedDistributions);

		if (failures.length > 0) {
			return {
				error: new SomePrepareDistributionError(successes, failures),
			};
		}

		return {
			data: successes.map(({ data }) => data),
		};
	}

	async prepareDistribution(
		distribution: PrepareDistributionParams,
	): Promise<MailchainResult<PreparedDistribution, PayloadSendingError>> {
		const { data, error } = await this.payloadSender.sendPayload(distribution.payload);
		if (error) {
			return {
				error: new PayloadSendingError(distribution, error),
			};
		}

		return {
			data: {
				distribution,
				preparedPayload: data,
			},
		};
	}
}
