import { createMessageComposer } from '@mailchain/message-composer';
import { MailAddress, MailData } from './types';

export const createMimeMessage = async (
	mailData: MailData,
): Promise<{
	original: string;
	visibleRecipients: string;
	blindRecipients: { recipient: MailAddress; content: string }[];
}> => {
	const msg = createMessageComposer()
		.id(mailData.id)
		.date(mailData.date)
		.subject(mailData.subject)
		.from(mailData.from)
		.recipients('To', ...mailData.recipients)
		.recipients('Cc', ...mailData.carbonCopyRecipients)
		.recipients('Bcc', ...mailData.blindCarbonCopyRecipients)
		.message('html', Buffer.from(mailData.message))
		.message('plain', Buffer.from(mailData.plainTextMessage));

	if (mailData.replyTo) msg.replyTo(mailData.replyTo);

	const builtMsg = await msg.build();

	return {
		original: builtMsg.forSender,
		visibleRecipients: builtMsg.forVisibleRecipients,
		blindRecipients: builtMsg.forBlindedRecipients.map(([recipient, content]) => ({
			recipient: { name: recipient.name!, address: recipient.address },
			content,
		})),
	};
};
