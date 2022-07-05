import { createMimeMessage } from 'mimetext';
import { MailData } from './types';

export const getMimeMessage = (mailData: MailData): string => {
	const msg = createMimeMessage();
	msg.setHeader('Message-ID', mailData.id);
	msg.setSender({ name: mailData.from.name, addr: mailData.from.address });
	msg.setRecipient(mailData.recipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	// @ts-ignore - for some reason ts complains about setCc
	msg.setCc(mailData.carbonCopyRecipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	// @ts-ignore - for some reason ts complains about setBcc
	msg.setBcc(mailData.blindCarbonCopyRecipients.map((rec) => ({ name: rec.name, addr: rec.address })));
	msg.setSubject(mailData.subject);
	msg.setMessage('text/plain', mailData.message.join('\n'));

	// msg.setMessage('text/plain', values.message.map((n) => Node.string(n)).join('\n'));

	return msg.asRaw();
};
