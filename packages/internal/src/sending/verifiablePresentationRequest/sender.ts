import { SignerWithPublicKey } from '@mailchain/crypto';
import canonicalize from 'canonicalize';
import { ProvidedMessagingKeyIncorrectError } from '@mailchain/signatures';
import { decodeUtf8 } from '@mailchain/encoding';
import { MessagingKeys, ResolveManyAddressesError } from '../../messagingKeys';
import { UnexpectedMailchainError } from '../../errors';
import { Distribution, SenderVerifier } from '../../transport';
import { VerifiablePresentationRequest } from '../../verifiableCredentials';
import { defaultConfiguration } from '../../configuration';
import { Configuration, MailchainResult } from '../..';
import { DistributePayloadError, PayloadDistributor, SentPayloadDistributionRequests } from '../distributor';
import { createPayload } from '../payload';

export type SentVerifiablePresentationRequest = {
	sentDeliveryRequests: SentPayloadDistributionRequests;
};

export type SendVerifiablePresentationRequestError =
	| ProvidedMessagingKeyIncorrectError
	| DistributePayloadError
	| UnexpectedMailchainError
	| ResolveManyAddressesError;

export class VerifiablePresentationRequestSender {
	constructor(
		private readonly senderMessagingKey: SignerWithPublicKey,
		private readonly messagingKeys: MessagingKeys,
		private readonly payloadDistributor: PayloadDistributor,
		private readonly senderVerifier: SenderVerifier,
	) {}

	static fromSenderMessagingKey(
		senderMessagingKey: SignerWithPublicKey,
		configuration: Configuration = defaultConfiguration,
	) {
		return new VerifiablePresentationRequestSender(
			senderMessagingKey,
			MessagingKeys.create(configuration),
			PayloadDistributor.create(configuration, senderMessagingKey),
			SenderVerifier.create(configuration),
		);
	}

	async sendVerifiablePresentationRequest(
		params: VerifiablePresentationRequest,
	): Promise<MailchainResult<SentVerifiablePresentationRequest, SendVerifiablePresentationRequestError>> {
		const canonicalized = canonicalize(params);
		if (!canonicalized) {
			return {
				error: new UnexpectedMailchainError('unable to create payload to send'),
			};
		}

		const { to, from } = params;
		const isSenderMatching = await this.senderVerifier.verifySenderOwnsFromAddress(
			from,
			this.senderMessagingKey.publicKey,
		);
		if (!isSenderMatching) {
			return { error: new ProvidedMessagingKeyIncorrectError('sender') };
		}

		const { data: resolvedAddresses, error: resolveAddressError } = await this.messagingKeys.resolveMany([
			from,
			to,
		]);
		if (resolveAddressError) {
			return { error: resolveAddressError };
		}

		const distribution: Distribution = {
			recipients: [to],
			payload: await createPayload(
				this.senderMessagingKey,
				decodeUtf8(canonicalized),
				'application/vnd.mailchain.verified-credential-request',
			),
		};

		const { data: distributedMail, error: distributedMailError } = await this.payloadDistributor.distributePayload({
			distributions: [distribution],
			resolvedAddresses,
		});

		if (distributedMailError) {
			return { error: distributedMailError };
		}

		return {
			data: {
				sentDeliveryRequests: distributedMail,
			},
		};
	}
}
