import * as mimetext from 'mimetext';
import { MailAddress, MailData } from './types';

type EncodedMailData = string;

export const createMimeMessage = (
	mailData: MailData,
): {
	original: EncodedMailData;
	visibleRecipients: EncodedMailData;
	blindRecipients: { recipient: MailAddress; content: EncodedMailData }[];
} => {
	const msg = mimetext.createMimeMessage();
	msg.setHeader('Message-ID', mailData.id);
	msg.setHeader('Date', mailData.date.toISOString());
	msg.setSender({ name: mailData.from.name, addr: mailData.from.address });
	msg.setRecipient(mailData.recipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	// @ts-ignore - for some reason ts complains about setCc
	msg.setCc(mailData.carbonCopyRecipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	msg.setSubject(encodeURIComponent(mailData.subject));
	msg.setMessage('text/html', encodeURIComponent(mailData.message));

	const visibleRecipients = msg.asRaw();
	// @ts-ignore - for some reason ts complains about setBcc
	msg.setBcc(mailData.blindCarbonCopyRecipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	const original = msg.asRaw();
	const blindRecipients = mailData.blindCarbonCopyRecipients.map((recipient) => {
		// @ts-ignore - for some reason ts complains about setBcc
		msg.setBcc({ name: recipient.name, addr: recipient.address });
		return { recipient, content: msg.asRaw() };
	});

	return { original, visibleRecipients, blindRecipients };
};
