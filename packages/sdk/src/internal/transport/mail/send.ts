import { SignerWithPublicKey } from '@mailchain/crypto';
import { encodeHex } from '@mailchain/encoding';
import { PublicKey } from '@mailchain/sdk/internal/api';
import { ApiKeyConvert } from '@mailchain/sdk/internal/apiHelpers';
import { createAxiosConfiguration } from '@mailchain/sdk/internal/axios/config';
import { MailAddress, MailData } from '@mailchain/sdk/internal/formatters/types';
import { Lookup, LookupResult } from '@mailchain/sdk/internal/identityKeys';
import { Configuration } from '@mailchain/sdk/mailchain';
import flatten from 'lodash/flatten';
import { Payload } from '../payload/content/payload';
import { SendPayloadDeliveryResult, PayloadSender, PreparePayloadResult } from '../payload/send';
import { createMailPayloads, Distribution } from './payload';

export interface SendMailParams {
	message: MailData;
	senderMessagingKey: SignerWithPublicKey;
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

type SendMailResultFailedResolveRecipients = {
	status: 'failed-resolve-recipients';
	failedRecipients: FailedAddressMessageKeyResolutionError[];
};

type SendMailResultFailedPrepare = {
	status: 'failed-prepare';
	failedDistributions: FailedDistributionError[];
};

type SendMailResultFullyCompleted = {
	status: 'success';
	deliveries: SendPayloadDeliveryResult[];
	sentMessage: Payload;
};

type SendMailResultPartiallyCompleted = {
	status: 'partially-completed';
	successfulDeliveries: SendPayloadDeliveryResult[];
	failedDeliveries: SendPayloadDeliveryResult[];
	sentMessage: Payload;
};

type PreparedDistribution = {
	distribution: Distribution;
	preparedPayload: PreparePayloadResult;
};

type SendMailResult =
	| SendMailResultFailedPrepare
	| SendMailResultFullyCompleted
	| SendMailResultPartiallyCompleted
	| SendMailResultFailedResolveRecipients;

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

	private async verifySender(fromAddress: MailAddress, senderMessagingKey: SignerWithPublicKey) {
		const fromPublicKey = await this.lookupMessageKeyResolver(fromAddress.address);
		const keyBytesMatch =
			encodeHex(ApiKeyConvert.public(fromPublicKey.messageKey).bytes) ===
			encodeHex(senderMessagingKey.publicKey.bytes);

		if (!keyBytesMatch) {
			throw new Error('messaging is not the latest message key for sender address');
		}

		return;
	}

	async send(params: SendMailParams): Promise<SendMailResult> {
		this.verifySender(params.message.from, params.senderMessagingKey);

		const messagePayloads = await createMailPayloads(params.senderMessagingKey, params.message);
		const resolvedRecipients = await this.resolveRecipientMessagingKeys(messagePayloads.distributions);
		if (resolvedRecipients.failed.length > 0) {
			return {
				status: 'failed-resolve-recipients',
				failedRecipients: resolvedRecipients.failed,
			};
		}

		const { successfulDistributions, failedDistributions } = await this.prepareDistributions(
			messagePayloads.distributions,
		);

		if (failedDistributions.length != 0) {
			return {
				status: 'failed-prepare',
				failedDistributions,
			};
		}

		const sendResults = await this.sendPayloads(successfulDistributions, resolvedRecipients);
		const allSucceeded = sendResults.every((x) => x.status === 'success');

		if (allSucceeded) {
			return {
				status: 'success',
				deliveries: sendResults,
				sentMessage: messagePayloads.original,
			};
		}
		return {
			status: 'partially-completed',
			failedDeliveries: sendResults.filter((x) => x.status === 'fail'),
			successfulDeliveries: sendResults.filter((x) => x.status === 'success'),
			sentMessage: messagePayloads.original,
		};
	}

	private async resolveRecipientMessagingKeys(distributions: Distribution[]): Promise<ResolvedRecipientsResult> {
		const recipientAddresses = flatten(distributions.map((d) => d.recipients.map((r) => r.address)));
		const recipientsPromises = await Promise.allSettled(
			recipientAddresses.map(async (address) => ({
				address,
				messagingKey: (await this.lookupMessageKeyResolver(address)
					.then((r) => r.messageKey)
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
