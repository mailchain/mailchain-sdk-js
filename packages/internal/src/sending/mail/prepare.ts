import { SignerWithPublicKey } from '@mailchain/crypto';
import { SenderMessagingKeyIncorrect } from '@mailchain/signatures';
import { Configuration, MailchainResult } from '../../';
import { MessagingKeys, ResolvedAddress, SomeAddressesUnresolvableError } from '../../messagingKeys';
import { MailDistribution, MailData, Payload, MailSenderVerifier } from '../../transport';
import { PreflightCheckError } from '../errors';
import { createMailPayloads } from './payloads';

export type PrepareMailParams = {
	message: MailData;
	senderMessagingKey: SignerWithPublicKey;
};

export type PreparedMail = {
	distributions: MailDistribution[];
	message: Payload;
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export type PrepareMailError = PreflightCheckError | SenderMessagingKeyIncorrect | SomeAddressesUnresolvableError;

export class MailPreparer {
	constructor(
		private readonly messagingKeys: MessagingKeys,
		private readonly mailSenderVerifier: MailSenderVerifier,
	) {}

	static create(configuration: Configuration) {
		return new MailPreparer(MessagingKeys.create(configuration), MailSenderVerifier.create(configuration));
	}

	async prepareMail(params: PrepareMailParams): Promise<MailchainResult<PreparedMail, PrepareMailError>> {
		const { message, senderMessagingKey } = params;
		if (message.subject.length === 0) {
			return { error: new PreflightCheckError('Subject must not be empty.') };
		}

		if (message.plainTextMessage.length === 0) {
			return { error: new PreflightCheckError('Content text must not be empty.') };
		}

		if (message.message.length === 0) {
			return { error: new PreflightCheckError('Content html must not be empty.') };
		}

		const allRecipients = [
			...message.recipients,
			...message.blindCarbonCopyRecipients,
			...message.carbonCopyRecipients,
		];
		if (allRecipients.length === 0) {
			return { error: new PreflightCheckError('No recipients found.') };
		}

		const isSenderMatching = await this.mailSenderVerifier.verifySenderOwnsFromAddress(
			message.from,
			senderMessagingKey.publicKey,
		);
		if (!isSenderMatching) {
			return { error: new SenderMessagingKeyIncorrect() };
		}

		// add at after checking if all recipients are empty
		const allParticipants = [...allRecipients, message.from];
		if (message.replyTo != null) {
			allParticipants.push(message.replyTo);
		}

		const { data: resolvedAddresses, error } = await this.messagingKeys.resolveMany(
			allParticipants.map((x) => x.address),
		);
		if (error) {
			return { error };
		}

		const messagePayloads = await createMailPayloads(params.senderMessagingKey, resolvedAddresses, message);

		return {
			data: {
				distributions: messagePayloads.distributions,
				message: messagePayloads.original,
				resolvedAddresses,
			},
		};
	}
}
