import { SignerWithPublicKey } from '@mailchain/crypto';
import { Configuration } from '../../../';
import { FailedAddressResolutionError, MessagingKeys, ResolvedAddress } from '../../messagingKeys';
import { Distribution, MailData, Payload, MailSenderVerifier } from '../../transport';
import { createMailPayloads, MailPayloadSender } from './payload';
import { MailDeliveryRequests, SendResult } from './deliveryRequests';

export interface PrepareParams {
	message: MailData;
	senderMessagingKey: SignerWithPublicKey;
}

export interface SendParams {
	distributions: Distribution[];
	resolvedAddresses: Map<string, ResolvedAddress>;
}

export type PrepareResultFailedResolveRecipients = {
	status: 'failed-resolve-recipients';
	failedRecipients: FailedAddressResolutionError[];
};

export type PrepareResultSuccess = {
	status: 'ok';
	distributions: Distribution[];
	message: Payload;
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export type PrepareResult = PrepareResultSuccess | PrepareResultFailedResolveRecipients;

export class MailSender {
	constructor(
		private readonly mailPayloadSender: MailPayloadSender,
		private readonly messagingKeys: MessagingKeys,
		private readonly mailSenderVerifier: MailSenderVerifier,
		private readonly mailDeliveryRequests: MailDeliveryRequests,
	) {}

	static create(configuration: Configuration, sender: SignerWithPublicKey) {
		return new MailSender(
			MailPayloadSender.create(configuration, sender),
			MessagingKeys.create(configuration),
			MailSenderVerifier.create(configuration),
			MailDeliveryRequests.create(configuration, sender),
		);
	}

	async prepare(params: PrepareParams): Promise<PrepareResult> {
		const { message, senderMessagingKey } = params;
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

		const isSenderMatching = await this.mailSenderVerifier.verifySenderOwnsFromAddress(
			message.from,
			senderMessagingKey.publicKey,
		);
		if (!isSenderMatching) {
			throw new Error('messaging is not the latest message key for sender address');
		}

		const allParticipants = [...allRecipients, message.from];
		if (message.replyTo != null) {
			allParticipants.push(message.replyTo);
		}

		const resolvedAddresses = await this.messagingKeys.resolveMany(allParticipants.map((x) => x.address));
		if (resolvedAddresses.failed && resolvedAddresses.failed.length > 0) {
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
			status: 'ok',
			distributions: messagePayloads.distributions,
			message: messagePayloads.original,
			resolvedAddresses: resolvedAddresses.resolved,
		};
	}

	async send(params: SendParams): Promise<SendResult> {
		const { successfulDistributions, failedDistributions } = await this.mailPayloadSender.prepare(
			params.distributions,
		);

		if (failedDistributions.length > 0) {
			return {
				status: 'failed-prepare',
				failedDistributions,
			};
		}

		return await this.mailDeliveryRequests.send(successfulDistributions, params.resolvedAddresses);
	}
}
