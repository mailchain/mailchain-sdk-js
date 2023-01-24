import { KindNaClSecretKey, SignerWithPublicKey } from '@mailchain/crypto';
import { EncodingTypes } from '@mailchain/encoding';
import { createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../../../mailchain';
import { MailData, Payload } from '../../transport';
import { createMimeMessage } from '../../formatters/generate';
import { ResolvedAddress } from '../../messagingKeys';
import { PayloadSender, PreparePayloadResult } from '../payload/send';
import { DeliveryRequests } from '../deliveryRequests/deliveryRequests';
import { Distribution } from '../../transport/mail/distribution';

export class FailedDistributionError extends Error {
	constructor(readonly distribution: Distribution, readonly cause: Error) {
		super('distribution has failed');
	}
}

export type PreparedDistribution = {
	distribution: Distribution;
	preparedPayload: PreparePayloadResult;
};

export async function createMailPayloads(
	senderMessagingKey: SignerWithPublicKey,
	resolvedAddresses: Map<string, ResolvedAddress>,
	mailData: MailData,
): Promise<{
	original: Payload;
	distributions: Distribution[];
}> {
	const message = await createMimeMessage(mailData, resolvedAddresses);

	const original = await createMailPayload(senderMessagingKey, message.original);
	const visibleRecipientsPayload = await createMailPayload(senderMessagingKey, message.visibleRecipients);
	const blindRecipients = await Promise.all(
		message.blindRecipients.map(async ({ recipient, content }) => ({
			recipients: [recipient],
			payload: await createMailPayload(senderMessagingKey, content),
		})),
	);

	return {
		original,
		distributions: [
			{
				recipients: [...mailData.recipients, ...mailData.carbonCopyRecipients],
				payload: visibleRecipientsPayload,
			},
			...blindRecipients,
		],
	};
}

export async function createMailPayload(
	senderMessagingKey: SignerWithPublicKey,
	contentPayload: string,
): Promise<Payload> {
	const contentBuffer = Buffer.from(contentPayload);
	return {
		Headers: {
			Origin: senderMessagingKey.publicKey,
			ContentSignature: await senderMessagingKey.sign(contentBuffer),
			Created: new Date(),
			ContentLength: contentBuffer.length,
			ContentType: 'message/x.mailchain',
			ContentEncoding: EncodingTypes.Base64,
			ContentEncryption: KindNaClSecretKey,
		},
		Content: contentBuffer,
	};
}

export class MailPayloadSender {
	constructor(private readonly payloadSender: PayloadSender, private readonly deliveryRequests: DeliveryRequests) {}

	static create(configuration: Configuration, signer: SignerWithPublicKey) {
		return new MailPayloadSender(
			PayloadSender.create(createAxiosConfiguration(configuration.apiPath), signer),
			DeliveryRequests.create(configuration, signer),
		);
	}

	/**
	 * Prepare payloads, update each distribution to the storage layer
	 * @param distributions payloads for each recipient
	 * @returns
	 */
	async prepare(distributions: Distribution[]) {
		const preparedDistributions = await Promise.allSettled(
			distributions.map(async (distribution) => {
				return {
					distribution,
					preparedPayload: await this.payloadSender.prepare(distribution.payload).catch((e) => {
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
}
