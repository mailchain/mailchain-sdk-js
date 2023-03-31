import { SignerWithPublicKey } from '@mailchain/crypto';
import { defaultConfiguration } from '../../configuration';
import { Configuration, MailchainResult } from '../..';
import { toMailData } from './convertSendMailParams';
import { SendMailParams } from './sendMailParams';
import { MailPreparer, PrepareMailError } from './prepare';
import { DistributeMailError, MailDistributor } from './distributor';
import { SentMailDeliveryRequests } from './deliveryRequests';

/**
 * The result of sending a mail. This contains the delivery requests for each recipient in the mail.
 */
export type SentMail = {
	/**
	 * The result of the delivery requests for each recipient in the mail.
	 */
	sentMailDeliveryRequests: SentMailDeliveryRequests;
};

export type SendMailError = PrepareMailError | DistributeMailError;

export class MailSender {
	constructor(
		private readonly senderMessagingKey: SignerWithPublicKey,
		private readonly mailPreparer: MailPreparer,
		private readonly mailDistributor: MailDistributor,
	) {}

	static fromSenderMessagingKey(
		senderMessagingKey: SignerWithPublicKey,
		configuration: Configuration = defaultConfiguration,
	) {
		return new MailSender(
			senderMessagingKey,
			MailPreparer.create(configuration),
			MailDistributor.create(configuration, senderMessagingKey),
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

		const { data: distributedMail, error: distributedMailError } = await this.mailDistributor.distributeMail({
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
