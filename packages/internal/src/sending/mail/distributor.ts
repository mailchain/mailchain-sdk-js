import { SignerWithPublicKey } from '@mailchain/crypto';
import { Configuration, MailchainResult } from '../../';
import { ResolvedAddress } from '../../messagingKeys';
import { MailDistribution } from '../../transport';
import { SentDeliveryRequest } from '../deliveryRequests';
import { MailPayloadSender, PrepareDistributionsError } from './payloadSender';
import { MailDeliveryRequests, SendMailDeliveryRequestsFailuresError } from './deliveryRequests';

export type DistributeMailError = PrepareDistributionsError | SendMailDeliveryRequestsFailuresError;

export type DistributeMailParams = {
	distributions: MailDistribution[];
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export type DistributedMail = SentDeliveryRequest[];

export class MailDistributor {
	constructor(
		private readonly mailPayloadSender: MailPayloadSender,
		private readonly mailDeliveryRequests: MailDeliveryRequests,
	) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new MailDistributor(
			MailPayloadSender.create(configuration, sender),
			MailDeliveryRequests.create(configuration, sender),
		);
	}

	async distributeMail(params: DistributeMailParams): Promise<MailchainResult<DistributedMail, DistributeMailError>> {
		const { data: preparedDistributions, error: prepareDistributionsError } =
			await this.mailPayloadSender.prepareDistributions(params.distributions);
		if (prepareDistributionsError) {
			return { error: prepareDistributionsError };
		}

		const { data: sentMailDeliveryRequests, error: sendMailDeliveryRequestsError } =
			await this.mailDeliveryRequests.sendMailDeliveryRequests({
				distributions: preparedDistributions,
				resolvedAddresses: params.resolvedAddresses,
			});

		if (sendMailDeliveryRequestsError) {
			return { error: sendMailDeliveryRequestsError };
		}

		return {
			data: sentMailDeliveryRequests,
		};
	}
}
