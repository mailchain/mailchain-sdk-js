/** Recommended line length limit defined in https://www.rfc-editor.org/rfc/rfc5322#section-2.1.1 */
export const LINE_LENGTH_FOLD = 78;

export const CRLF = '\r\n' as const;

export const HEADER_LABELS = {
	MimeVersion: 'MIME-Version',
	MessageId: 'Message-ID',
	Subject: 'Subject',
	Date: 'Date',
	From: 'From',
	To: 'To',
	Cc: 'Cc',
	Bcc: 'Bcc',
	ContentType: 'Content-Type',
	ContentTransferEncoding: 'Content-Transfer-Encoding',
	ContentDisposition: 'Content-Disposition',
	ContentId: 'Content-ID',
} as const;
