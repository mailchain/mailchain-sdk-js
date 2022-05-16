// mimetext/index.d.ts

declare module 'mimetext' {
	interface MIMETextError extends Error {
		description: string;
		name: string;
	}

	interface MIMEMessageContent {
		data: string;
		headers: MIMEMessageHeader;

		isAttachment(): bool;
	}
	interface MIMEMessageHeader {
		placement: 'header' | 'content';
		name: string;
		value: any;
		disabled: boolean;
		required: boolean;
	}
	interface MIMEMessage {
		headers: MIMEMessageHeader;
		messages: MIMEMessageContent[];
		setSender(value: string | Partial<Mailbox>);
		getSender(): Mailbox;
		setRecipient(value: string | MIMEAddress);
		getRecipients(): Mailbox[];
		setHeader(key: string, value: any);
		getHeader(key: string): any;
		setSubject(value: string): string;
		getSubject(): string;
		setMessage(type: 'text/html' | 'text/plain', data: string, moreHeaders = {}): MIMEMessageContent;
		setAttachment(filename: string, type: string, data: string, moreHeaders = {}): MIMEMessageContent;
		getMessageByType(type: 'text/html' | 'text/plain'): MIMEMessageContent;
		getAttachments(): MIMEMessageContent[];
		asRaw(): string;
		asEncoded(): string;
		toBase64(v: any): string;
	}
	interface Mailbox {
		name: string;
		addr: string;
		type: 'cc' | 'to' | 'bcc';
		input: string;
		inputType: 'OBJECT' | 'SPEC_COMPLIANT_TEXT' | 'TEXT';
	}

	export const createMimeMessage: () => MIMEMessage;
}
