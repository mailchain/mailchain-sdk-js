import { Configuration } from '../../configuration';
import { parseMimeText } from '../../formatters/parse';
import { parseMailerContentFromJSON, SenderVerifier, MailerPayload } from '../../transport';

export class MailerAuthorVerifier {
	constructor(private readonly senderVerifier: SenderVerifier) {}

	static create(configuration: Configuration) {
		return new MailerAuthorVerifier(SenderVerifier.create(configuration));
	}

	/**
	 * Checks if the author of the mailer is the same as the from address.
	 * @param payload - The mailer payload
	 * @returns
	 */
	async verifyAuthorOwnsFromAddress(payload: MailerPayload, rfcMail: Buffer): Promise<boolean> {
		const mailerContent = parseMailerContentFromJSON(payload.Content.toString());
		const parsedContent = await parseMimeText(rfcMail);

		if (mailerContent.authorMailAddress.address !== parsedContent.mailData.from.address) {
			throw new Error('author address does not match from address');
		}

		return await this.senderVerifier.verifySenderOwnsFromAddress(
			parsedContent.mailData.from.address,
			mailerContent.authorMessagingKey,
		);
	}
}
