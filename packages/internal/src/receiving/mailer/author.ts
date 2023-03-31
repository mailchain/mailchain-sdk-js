import { Configuration } from '../../configuration';
import { parseMimeText } from '../../formatters/parse';
import { parseMailerContentFromJSON, MailSenderVerifier, Payload } from '../../transport';

export class MailerAuthorVerifier {
	constructor(private readonly mailSenderVerifier: MailSenderVerifier) {}

	static create(configuration: Configuration) {
		return new MailerAuthorVerifier(MailSenderVerifier.create(configuration));
	}

	/**
	 * Checks if the author of the mailer is the same as the from address.
	 * @param payload - The mailer payload
	 * @returns
	 */
	async verifyAuthorOwnsFromAddress(payload: Payload, rfcMail: Buffer): Promise<boolean> {
		const mailerContent = parseMailerContentFromJSON(payload.Content.toString());
		const parsedContent = await parseMimeText(rfcMail);

		if (mailerContent.authorMailAddress.address !== parsedContent.mailData.from.address) {
			throw new Error('author address does not match from address');
		}

		return await this.mailSenderVerifier.verifySenderOwnsFromAddress(
			parsedContent.mailData.from,
			mailerContent.authorMessagingKey,
		);
	}
}
