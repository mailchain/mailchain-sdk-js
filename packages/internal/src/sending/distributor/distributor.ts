import { SignerWithPublicKey } from '@mailchain/crypto';
import { Configuration } from '../../configuration';
import { MailchainResult, partitionMailchainResults } from '../../mailchainResult';
import { ResolvedAddress } from '../../messagingKeys';
import { Distribution } from '../../transport';
import { SentPayloadDistributionRequest } from '../deliveryRequests';
import { PayloadStorer, StorePayloadError, StoredPayload } from '../payload/store';
import { PayloadDeliveryRequests, SendPayloadDistributionRequestsFailuresError } from './deliveryRequests';

export type CreateDistributionRequestParams = Distribution;

export class CreateDistributionRequestsFailuresError extends Error {
	readonly type = 'create_distribution_requests_failures';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#create_distribution_requests_failures';
	constructor(
		public readonly successes: Array<{
			params: CreateDistributionRequestParams;
			data: DistributionRequest;
		}>,
		public readonly failures: Array<{
			params: CreateDistributionRequestParams;
			error: StorePayloadError;
		}>,
	) {
		super(`Not all distributions prepared correctly. Check the failed distributions to retry failed requests.`);
	}
}

export type CreateDistributionRequestsError = CreateDistributionRequestsFailuresError;

export type DistributionRequest = {
	distribution: Distribution;
	storedPayload: StoredPayload;
};
export type DistributionRequests = DistributionRequest[];

export type DistributePayloadError = CreateDistributionRequestsError | SendPayloadDistributionRequestsFailuresError;

export type DistributePayloadParams = {
	distributions: Distribution[];
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export type DistributedPayload = SentPayloadDistributionRequest[];

export class PayloadDistributor {
	constructor(
		private readonly payloadStorer: PayloadStorer,
		private readonly payloadDeliveryRequests: PayloadDeliveryRequests,
	) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new PayloadDistributor(
			PayloadStorer.create(configuration, sender),
			PayloadDeliveryRequests.create(configuration, sender),
		);
	}

	async distributePayload(
		params: DistributePayloadParams,
	): Promise<MailchainResult<DistributedPayload, DistributePayloadError>> {
		const { data: distributionRequests, error: createDistributionRequestsError } =
			await this.createDistributionRequests(params.distributions);
		if (createDistributionRequestsError) {
			return { error: createDistributionRequestsError };
		}

		const { resolvedAddresses } = params;

		const { data: sentPayloadDistributionRequests, error: sendPayloadDistributionRequests } =
			await this.payloadDeliveryRequests.sendPayloadDistributionRequests({
				distributionRequests,
				resolvedAddresses,
			});

		if (sendPayloadDistributionRequests) {
			return { error: sendPayloadDistributionRequests };
		}

		return {
			data: sentPayloadDistributionRequests,
		};
	}

	private async createDistributionRequests(
		distributions: Distribution[],
	): Promise<MailchainResult<DistributionRequests, CreateDistributionRequestsError>> {
		const createdDistributionsRequests = await Promise.all(
			distributions.map(async (distribution) => {
				const result = await this.payloadStorer.storePayload(distribution.payload);
				return {
					result: {
						data: { storedPayload: result.data, distribution },
						error: result.error,
					} as MailchainResult<DistributionRequest, StorePayloadError>,
					params: distribution,
				};
			}),
		);

		const { successes, failures } = partitionMailchainResults(createdDistributionsRequests);

		if (failures.length > 0) {
			return {
				error: new CreateDistributionRequestsFailuresError(successes, failures),
			};
		}

		return {
			data: successes.map((success) => success.data),
		};
	}
}
