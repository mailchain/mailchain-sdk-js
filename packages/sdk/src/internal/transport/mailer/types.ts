import { MailAddress } from '../mail/types';

export type MailerData = {
	/**
	 * Message subject line, this will become the `Subject:` header in the email.
	 */
	subject: string;
	/**
	 * Reply-To address, this will become the `Reply-To:` header in the email.
	 */
	replyTo?: MailAddress;
	/**
	 * HTML formatted message, this will become the `text/html` part of the email.
	 */
	message: string;
	/**
	 * Plain text formatted message, this will become the `text/plain` part of the email.
	 */
	plainTextMessage: string;
};
