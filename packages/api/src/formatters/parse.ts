import { DecodeBase64 } from '@mailchain/encoding';
import { MailData } from './types';

export async function parseMimeText(text: string): Promise<MailData> {
	const parse = (await import('emailjs-mime-parser')).default;
	const {
		content,
		headers,
		headers: { from, to, bcc, cc, subject },
	} = parse(text);

	return {
		id: headers['message-id'][0].value,
		from: { name: from[0].value[0].name, address: from[0].value[0].address },
		recipients: to[0].value.map((it: any) => ({ name: it.name, address: it.address })),
		carbonCopyRecipients: cc?.[0].value.map((it: any) => ({ name: it.name, address: it.address })) ?? [],
		blindCarbonCopyRecipients: bcc?.[0].value.map((it: any) => ({ name: it.name, address: it.address })) ?? [],
		subject: subject?.[0].value.length > 0 ? subject?.[0].value : parseSubjectHeader(subject?.[0].initial),
		message: Buffer.from(content ?? '')
			.toString()
			.split('\n'),
	};
}

function parseSubjectHeader(rawSubject: string) {
	// https://dmorgan.info/posts/encoded-word-syntax/
	// tl;dr if the subject conitans non ASCII characters, the subject is base64 encoded
	// Sample value: =?UTF-8?B?ZnVjayDwn5CO?=!
	// Parts: =?<charset>?<encoding>?<encoded-text>?=
	const [_, charset, encoding, encodedText] = rawSubject.split('?');
	if (encoding === 'B') {
		return Buffer.from(DecodeBase64(encodedText)).toString(charset as BufferEncoding);
	}
	return encodedText;
}
