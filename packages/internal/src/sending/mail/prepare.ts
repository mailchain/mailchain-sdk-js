import { SignerWithPublicKey } from '@mailchain/crypto';
import { ProvidedMessagingKeyIncorrectError } from '@mailchain/signatures';
import { Configuration, MailchainResult } from '../../';
import { MessagingKeys, ResolvedAddress, ResoleAddressesFailuresError } from '../../messagingKeys';
import { Distribution, MailData, Payload, SenderVerifier } from '../../transport';
import { PreflightCheckError } from '../errors';
import { createMailPayloads } from './payloads';

export type PrepareMailParams = {
	message: MailData;
	payloadPluginHeaders?: Record<string, unknown>;
	senderMessagingKey: SignerWithPublicKey;
};

export type PreparedMail = {
	distributions: Distribution[];
	message: Payload;
	resolvedAddresses: Map<string, ResolvedAddress>;
};

export type PrepareMailError = PreflightCheckError | ProvidedMessagingKeyIncorrectError | ResoleAddressesFailuresError;

export class MailPreparer {
	constructor(
		private readonly messagingKeys: MessagingKeys,
		private readonly senderVerifier: SenderVerifier,
	) {}

	static create(configuration: Configuration) {
		return new MailPreparer(MessagingKeys.create(configuration), SenderVerifier.create(configuration));
	}

	async prepareMail(params: PrepareMailParams): Promise<MailchainResult<PreparedMail, PrepareMailError>> {
		const { message, senderMessagingKey } = params;
		if (message.subject.length === 0) {
			return { error: new PreflightCheckError('Subject must not be empty.') };
		}

		if (message.plainTextMessage.length === 0) {
			return { error: new PreflightCheckError('Content plaintext must not be empty.') };
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

		const isSenderMatching = await this.senderVerifier.verifySenderOwnsFromAddress(
			message.from.address,
			senderMessagingKey.publicKey,
		);
		if (!isSenderMatching) {
			return { error: new ProvidedMessagingKeyIncorrectError('sender') };
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

		// Separate payloads are sent to each recipient in the case of bcc recipients.
		const messagePayloads = await createMailPayloads(
			params.senderMessagingKey,
			resolvedAddresses,
			message,
			params.payloadPluginHeaders,
		);

		return {
			data: {
				distributions: messagePayloads.distributions,
				message: messagePayloads.original,
				resolvedAddresses,
			},
		};
	}
}
