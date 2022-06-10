import { createMimeMessage } from 'mimetext';
import { Descendant, Node } from 'slate';

export interface Address {
	label: string;
	value: string;
}
export interface NewMessageFormValues {
	type?: 'reply' | 'reply-all' | 'forward';
	from: Address;
	recipients: Address[];
	carbonCopyRecipients: Address[];
	blindCarbonCopyRecipients: Address[];
	message: Descendant[]; //ToDo: should not have slate deps here
	subject: string;
}

export const getMimeMessage = (values: NewMessageFormValues): string => {
	const msg = createMimeMessage();
	msg.setSender({ name: values.from.label, addr: values.from.value });
	values.recipients.forEach((rec) => {
		msg.setRecipient({ name: rec.label, addr: rec.value });
	});
	msg.setSubject(values.subject);
	msg.setMessage('text/plain', values.message.map((n) => Node.string(n)).join('\n'));

	return msg.asRaw();
};
