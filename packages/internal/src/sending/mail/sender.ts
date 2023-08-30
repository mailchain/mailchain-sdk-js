import { SignerWithPublicKey } from '@mailchain/crypto';
import { defaultConfiguration } from '../../configuration';
import { Configuration, MailchainResult } from '../..';
import { DistributePayloadError, PayloadDistributor, SentPayloadDistributionRequests } from '../distributor';
import { toMailData } from './convertSendMailParams';
import { SendMailParams } from './sendMailParams';
import { MailPreparer, PrepareMailError } from './prepare';

/**
 * The result of sending a mail. This contains the delivery requests for each recipient in the mail.
 */
export type SentMail = {
	/**
	 * The result of the delivery requests for each recipient in the mail.
	 */
	sentMailDeliveryRequests: SentPayloadDistributionRequests;
};

export type SendMailError = PrepareMailError | DistributePayloadError;

export class MailSender {
	constructor(
		private readonly senderMessagingKey: SignerWithPublicKey,
		private readonly mailPreparer: MailPreparer,
		private readonly payloadDistributor: PayloadDistributor,
	) {}

	static fromSenderMessagingKey(
		senderMessagingKey: SignerWithPublicKey,
		configuration: Configuration = defaultConfiguration,
	) {
		return new MailSender(
			senderMessagingKey,
			MailPreparer.create(configuration),
			PayloadDistributor.create(configuration, senderMessagingKey),
		);
	}

	/**
	 * Send a mail to any blockchain or Mailchain address using the address Messaging Key.
	 *
	 * @param params {@link SendMailParams} - The parameters for sending a mail.
	 * @returns
	 */
	async sendMail(params: SendMailParams): Promise<MailchainResult<SentMail, SendMailError>> {
		const { data: preparedMail, error: prepareMailError } = await this.mailPreparer.prepareMail({
			message: toMailData(params),
			senderMessagingKey: this.senderMessagingKey,
		});

		if (prepareMailError) {
			return { error: prepareMailError };
		}

		const { data: distributedMail, error: distributedMailError } = await this.payloadDistributor.distributePayload({
			distributions: preparedMail.distributions,
			resolvedAddresses: preparedMail.resolvedAddresses,
		});

		if (distributedMailError) {
			return { error: distributedMailError };
		}

		return {
			data: {
				sentMailDeliveryRequests: distributedMail,
			},
		};
	}
}
