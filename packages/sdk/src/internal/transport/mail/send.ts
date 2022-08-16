import { SignerWithPublicKey } from '@mailchain/crypto';
import { PublicKey } from '@mailchain/sdk/internal/api';
import { ApiKeyConvert } from '@mailchain/sdk/internal/apiHelpers';
import { createAxiosConfiguration } from '@mailchain/sdk/internal/axios/config';
import { MailAddress, MailData } from '@mailchain/sdk/internal/formatters/types';
import { Lookup, LookupResult } from '@mailchain/sdk/internal/identityKeys';
import { Configuration } from '@mailchain/sdk/mailchain';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import { Payload } from '../payload/content/payload';
import { SendPayloadDeliveryResult, PayloadSender, PreparePayloadResult } from '../payload/send';
import { createMailPayloads, Distribution } from './payload';

export interface PrepareParams {
	message: MailData;
	senderMessagingKey: SignerWithPublicKey;
}

export interface SendParams {
	distributions: Distribution[];
	resolvedRecipients: ResolvedRecipientsResult;
}

export class FailedAddressMessageKeyResolutionError extends Error {
	constructor(readonly address: string, cause: Error) {
		super(`resoluton for ${address} has failed`, { cause });
	}
}

export class FailedDistributionError extends Error {
	constructor(readonly distribution: Distribution, cause: Error) {
		super('distribution has failed', { cause });
	}
}

type PrepareResultFailedResolveRecipients = {
	status: 'failed-resolve-recipients';
	failedRecipients: FailedAddressMessageKeyResolutionError[];
};

type PrepareResultSuccess = {
	status: 'prepare-success';
	distributions: Distribution[];
	message: Payload;
	resolvedRecipients: ResolvedRecipientsResult;
};

export type PrepareResult = PrepareResultSuccess | PrepareResultFailedResolveRecipients;

type SendResultFailedPrepare = {
	status: 'failed-prepare';
	failedDistributions: FailedDistributionError[];
};

type SendResultFullyCompleted = {
	status: 'success';
	deliveries: SendPayloadDeliveryResult[];
};

type SendResultPartiallyCompleted = {
	status: 'partially-completed';
	successfulDeliveries: SendPayloadDeliveryResult[];
	failedDeliveries: SendPayloadDeliveryResult[];
};

type PreparedDistribution = {
	distribution: Distribution;
	preparedPayload: PreparePayloadResult;
};

export type SendResult = SendResultFailedPrepare | SendResultFullyCompleted | SendResultPartiallyCompleted;

export type LookupMessageKeyResolver = (address: string) => Promise<LookupResult>;

type ResolvedRecipientsResult = {
	success: { [key: string]: PublicKey };
	failed: FailedAddressMessageKeyResolutionError[];
};

export class MailSender {
	constructor(
		private readonly sender: PayloadSender,
		private readonly lookupMessageKeyResolver: LookupMessageKeyResolver,
	) {}

	static create(configuration: Configuration, signer: SignerWithPublicKey) {
		return new MailSender(
			PayloadSender.create(createAxiosConfiguration(configuration), signer),
			(address: string) => Lookup.create(configuration).messageKey(address),
		);
	}

	private async verifySender(fromAddress: MailAddress, senderMessagingKey: SignerWithPublicKey): Promise<boolean> {
		const resolvedMessagingKey = await this.lookupMessageKeyResolver(fromAddress.address);

		const resolvedMessagingKeyBytes = ApiKeyConvert.public(resolvedMessagingKey.messagingKey).bytes;
		const paramsMessagingKey = senderMessagingKey.publicKey.bytes;

		return isEqual(paramsMessagingKey, resolvedMessagingKeyBytes);
	}

	async prepare(params: PrepareParams): Promise<PrepareResult> {
		const { message } = params;
		if (message.subject.length === 0) {
			throw new Error('subject must not be empty');
		}

		if (message.plainTextMessage.length === 0) {
			throw new Error('content text must not be empty');
		}

		if (message.message.length === 0) {
			throw new Error('content html must not be empty');
		}

		if (
			[...message.recipients, ...message.blindCarbonCopyRecipients, ...message.carbonCopyRecipients].length === 0
		) {
			throw new Error('at least one recipient is required');
		}

		const isSenderMatching = await this.verifySender(message.from, params.senderMessagingKey);
		if (!isSenderMatching) {
			throw new Error('messaging is not the latest message key for sender address');
		}

		const messagePayloads = await createMailPayloads(params.senderMessagingKey, message);
		const resolvedRecipients = await this.resolveRecipientMessagingKeys(messagePayloads.distributions);
		if (resolvedRecipients.failed.length > 0) {
			return {
				status: 'failed-resolve-recipients',
				failedRecipients: resolvedRecipients.failed,
			};
		}

		return {
			status: 'prepare-success',
			distributions: messagePayloads.distributions,
			message: messagePayloads.original,
			resolvedRecipients,
		};
	}

	async send(params: SendParams): Promise<SendResult> {
		const { successfulDistributions, failedDistributions } = await this.prepareDistributions(params.distributions);

		if (failedDistributions.length !== 0) {
			return {
				status: 'failed-prepare',
				failedDistributions,
			};
		}

		const sendResults = await this.sendPayloads(successfulDistributions, params.resolvedRecipients);
		const allSucceeded = sendResults.every((x) => x.status === 'success');

		if (allSucceeded) {
			return {
				status: 'success',
				deliveries: sendResults,
			};
		}
		return {
			status: 'partially-completed',
			failedDeliveries: sendResults.filter((x) => x.status === 'fail'),
			successfulDeliveries: sendResults.filter((x) => x.status === 'success'),
		};
	}

	private async resolveRecipientMessagingKeys(distributions: Distribution[]): Promise<ResolvedRecipientsResult> {
		const recipientAddresses = flatten(distributions.map((d) => d.recipients.map((r) => r.address)));
		const recipientsPromises = await Promise.allSettled(
			recipientAddresses.map(async (address) => ({
				address,
				messagingKey: (await this.lookupMessageKeyResolver(address)
					.then((r) => r.messagingKey)
					.catch((e: Error) => {
						throw new FailedAddressMessageKeyResolutionError(address, e);
					})) as PublicKey,
			})),
		);

		const resolvedRecipients: ResolvedRecipientsResult = (await recipientsPromises).reduce(
			(acc, result) => {
				if (result.status === 'fulfilled') {
					const { address, messagingKey } = result.value;
					return { ...acc, success: { ...acc.success, [address]: messagingKey } };
				}
				if (result.reason instanceof FailedAddressMessageKeyResolutionError) {
					return { ...acc, failed: [...acc.failed, result.reason] };
				}
				return acc;
			},
			{ success: {}, failed: [] as FailedAddressMessageKeyResolutionError[] },
		);

		return resolvedRecipients;
	}

	private async prepareDistributions(distributions: Distribution[]) {
		const preparedDistributions = await Promise.allSettled(
			distributions.map(async (distribution) => {
				return {
					distribution,
					preparedPayload: await this.sender.prepare(distribution.payload).catch((e) => {
						throw new FailedDistributionError(distribution, e);
					}),
				};
			}),
		);

		const distErrors = [] as FailedDistributionError[];
		const successfulDistributions = [] as PreparedDistribution[];

		preparedDistributions.forEach((x) => {
			if (x.status === 'rejected') {
				distErrors.push(x.reason);
				return;
			}
			successfulDistributions.push(x.value);
		});

		return {
			successfulDistributions,
			failedDistributions: distErrors,
		};
	}

	private async sendPayloads(
		successfulDistributions: PreparedDistribution[],
		resolvedRecipients: ResolvedRecipientsResult,
	) {
		const sendResults = flatten(
			await Promise.all(
				successfulDistributions.map(async (preparedDistribution) => {
					const recipients = preparedDistribution.distribution.recipients
						.filter(({ address }) => resolvedRecipients.success[address])
						.map(({ address }) => resolvedRecipients.success[address]);
					const { payloadRootEncryptionKey, payloadUri } = preparedDistribution.preparedPayload;

					return this.sender.send({
						payloadRootEncryptionKey,
						payloadUri,
						recipients,
					});
				}),
			),
		);

		return sendResults;
	}
}
