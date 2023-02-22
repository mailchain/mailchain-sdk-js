import { ReadonlyMailPayload } from '../../../receiving/mail';
import { ReadonlyMailerPayload } from '../../../transport';
import { MailPayloadHeaders } from './headers';

/**
 * Payload.
 */
export interface MailPayload {
	/**
	 * @see MailPayloadHeaders
	 */
	Headers: MailPayloadHeaders;
	/**
	 * Raw/data/object that are decrypted and parsed base on the the headers.
	 */
	Content: Buffer;
}

/**
 * Encrypted payload.
 */
export interface MailEncryptedPayload {
	EncryptedHeaders: Buffer;

	EncryptedContentChunks: Buffer[];
}

export function convertPayload(payload: ReadonlyMailPayload): MailPayload {
	switch (payload.Headers.ContentType) {
		case 'message/x.mailchain':
			return payload;
		case 'message/x.mailchain-mailer':
			const castPayload = payload as ReadonlyMailerPayload;

			const headers = {
				...payload.Headers,
				MailerContent: castPayload.MailerContent,
			} as MailPayloadHeaders;

			return {
				Headers: headers,
				Content: castPayload.Content,
			};
		default:
			throw new Error(`Unsupported content type: ${payload.Headers.ContentType}`);
	}
}
