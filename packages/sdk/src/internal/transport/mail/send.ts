import { ProtocolType } from '@mailchain/addressing';
import { PublicKey, SignerWithPublicKey } from '@mailchain/crypto';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import { Configuration } from '../../../';
import { createAxiosConfiguration } from '../../axios/config';
import { MailAddress, MailData } from '../../formatters/types';
import { Lookup, LookupResult } from '../../identityKeys';
import { Payload } from '../payload/content/payload';
import { SendPayloadDeliveryResult, PayloadSender, PreparePayloadResult } from '../payload/send';
import { createMailPayloads, Distribution } from './payload';

export interface PrepareParams {
	message: MailData;
	senderMessagingKey: SignerWithPublicKey;
}

export interface SendParams {
	distributions: Distribution[];
	resolvedAddresses: ResolvedAddressResult['resolved'];
}

export class FailedAddressMessageKeyResolutionsError extends Error {
	constructor(public readonly failedResolutions: FailedAddressResolutionError[]) {
		super(`at least one address resolution has failed`);
	}
}

export class FailedAddressResolutionError extends Error {
	constructor(readonly address: string, readonly cause: Error) {
		super(`resolution for ${address} has failed`);
	}
}

export class FailedDistributionError extends Error {
	constructor(readonly distribution: Distribution, readonly cause: Error) {
		super('distribution has failed');
	}
}

type PrepareResultFailedResolveRecipients = {
	status: 'failed-resolve-recipients';
	failedRecipients: FailedAddressResolutionError[];
};

type PrepareResultSuccess = {
	status: 'prepare-success';
	distributions: Distribution[];
	message: Payload;
	resolvedAddresses: ResolvedAddressResult['resolved'];
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

export type ResolvedAddressResult = {
	resolved: Map<string, LookupResult>;
	failed: FailedAddressResolutionError[];
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

		const resolvedMessagingKeyBytes = resolvedMessagingKey.messagingKey.bytes;
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

		const allRecipients = [
			...message.recipients,
			...message.blindCarbonCopyRecipients,
			...message.carbonCopyRecipients,
		];
		if (allRecipients.length === 0) {
			throw new Error('at least one recipient is required');
		}
		const isSenderMatching = await this.verifySender(message.from, params.senderMessagingKey);
		if (!isSenderMatching) {
			throw new Error('messaging is not the latest message key for sender address');
		}

		const allParticipants = [...allRecipients, message.from];
		if (message.replyTo != null) {
			allParticipants.push(message.replyTo);
		}

		const resolvedAddresses = await this.resolveAddresses(allParticipants);
		if (resolvedAddresses.failed.length > 0) {
			return {
				status: 'failed-resolve-recipients',
				failedRecipients: resolvedAddresses.failed,
			};
		}

		const messagePayloads = await createMailPayloads(
			params.senderMessagingKey,
			resolvedAddresses.resolved,
			message,
		);

		return {
			status: 'prepare-success',
			distributions: messagePayloads.distributions,
			message: messagePayloads.original,
			resolvedAddresses: resolvedAddresses.resolved,
		};
	}

	async send(params: SendParams): Promise<SendResult> {
		const { successfulDistributions, failedDistributions } = await this.prepareDistributions(params.distributions);

		if (failedDistributions.length > 0) {
			return {
				status: 'failed-prepare',
				failedDistributions,
			};
		}

		const sendResults = await this.sendPayloads(successfulDistributions, params.resolvedAddresses);
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

	private async resolveAddresses(mailAddresses: MailAddress[]): Promise<ResolvedAddressResult> {
		const addresses = [...new Set(mailAddresses.map((r) => r.address))];
		const lookupResults = await Promise.allSettled(
			addresses.map(async (address) => {
				const lookupResult = await this.lookupMessageKeyResolver(address).catch((e: Error) => {
					throw new FailedAddressResolutionError(address, e);
				});
				return { address, ...lookupResult };
			}),
		);

		const resolved: ResolvedAddressResult['resolved'] = new Map();
		const failed: ResolvedAddressResult['failed'] = [];
		for (const result of lookupResults) {
			if (result.status === 'fulfilled') {
				const { messagingKey, identityKey, protocol, network } = result.value;
				resolved.set(result.value.address, { messagingKey, identityKey, protocol, network });
			} else {
				failed.push(result.reason as FailedAddressResolutionError);
			}
		}

		return { resolved, failed };
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

		const distErrors: FailedDistributionError[] = [];
		const successfulDistributions: PreparedDistribution[] = [];

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
		resolvedAddresses: ResolvedAddressResult['resolved'],
	) {
		const sendResults = flatten(
			await Promise.all(
				successfulDistributions.map(async (preparedDistribution) => {
					const recipients = preparedDistribution.distribution.recipients.map(
						({ address }) => resolvedAddresses.get(address)!.messagingKey,
					);
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
