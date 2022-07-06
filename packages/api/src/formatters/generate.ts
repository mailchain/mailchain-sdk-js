import * as mimetext from 'mimetext';
import { MailAddress, MailData } from './types';

export const createMimeMessage = (
	mailData: MailData,
): { original: string; visibleRecipients: string; blindRecipients: { recipient: MailAddress; content: string }[] } => {
	const msg = mimetext.createMimeMessage();
	msg.setHeader('Message-ID', mailData.id);
	msg.setHeader('Date', new Date().toISOString());
	msg.setSender({ name: mailData.from.name, addr: mailData.from.address });
	msg.setRecipient(mailData.recipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	// @ts-ignore - for some reason ts complains about setCc
	msg.setCc(mailData.carbonCopyRecipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	msg.setSubject(mailData.subject);
	msg.setMessage('text/plain', mailData.message.join('\n'));

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
