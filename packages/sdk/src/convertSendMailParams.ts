import { secureRandom } from '@mailchain/crypto/rand';
import { encodeBase64 } from '@mailchain/encoding';
import { MailAddress, MailData } from './internal/formatters/types';
import { SendMailParams } from './types';

/**
 * Temporary adapter migration function to convert from SDK mail params to internal params.
 *
 * @deprecated This will be removed in favor of removing the internal params and accepting these params.
 */
export function toMailData(params: SendMailParams): MailData {
	const mailDomain = params.from.split('@')[1];
	return {
		id: `${encodeBase64(secureRandom(32))}@${mailDomain}`,
		date: new Date(),
		subject: params.subject,
		from: { name: params.from, address: params.from },
		recipients: params.to?.map((to) => createMailAddress(to)) ?? [],
		carbonCopyRecipients: params.cc?.map((cc) => createMailAddress(cc)) ?? [],
		blindCarbonCopyRecipients: params.bcc?.map((bcc) => createMailAddress(bcc)) ?? [],
		message: params.content.html?.toString() ?? '',
		plainTextMessage: params.content.text?.toString() ?? '',
	};
}

/**
 * Temporary adapter migration function to convert from internal MailData to SDK mail params.
 *
 * @deprecated This will be removed in favor of removing the internal params and accepting these params.
 */
function createMailAddress(address: string): MailAddress {
	const name = address.split('@')[0];
	return { name, address };
}

/**
 * Temporary adapter migration function to convert from internal MailData to SDK mail params.
 *
 * @deprecated This will be removed in favor of removing the internal params and accepting these params.
 */
export function fromMailData(mailData: MailData): SendMailParams {
	return {
		from: mailData.from.address,
		to: mailData.recipients.map((r) => r.address),
		cc: mailData.carbonCopyRecipients.map((r) => r.address),
		bcc: mailData.blindCarbonCopyRecipients.map((r) => r.address),
		subject: mailData.subject,
		content: {
			html: mailData.message,
			text: mailData.plainTextMessage,
		},
	};
}
