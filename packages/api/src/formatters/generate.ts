import { createMimeMessage } from 'mimetext';
import { Descendant, Node } from 'slate';

export interface Address {
	label: string;
	value: string;
}

export enum MessageType {
	NEW,
	REPLY,
	REPLY_ALL,
	FORWARD,
}
export interface NewMessageFormValues {
	type: MessageType;
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
	msg.setRecipient(values.recipients.map((rec) => ({ name: rec.label, addr: rec.value })));
	msg.setSubject(values.subject);

	msg.setMessage('text/plain', values.message.map((n) => Node.string(n)).join('\n'));

	return msg.asRaw();
};
