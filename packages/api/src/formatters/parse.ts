import { DecodeBase64 } from '@mailchain/encoding';
import { MessageType, NewMessageFormValues } from './generate';

export async function parseMimeText(text: string): Promise<NewMessageFormValues> {
	const parse = (await import('emailjs-mime-parser')).default;
	const {
		content,
		headers: { from, to, subject },
	} = parse(text);

	return {
		from: { label: from[0].value[0].name, value: from[0].value[0].address },
		recipients: to[0].value.map((it) => ({ label: it.name, value: it.address })),
		type: MessageType.NEW,
		carbonCopyRecipients: [],
		blindCarbonCopyRecipients: [],
		subject: subject?.[0].value.length > 0 ? subject?.[0].value : parseSubjectHeader(subject?.[0].initial),
		message: Buffer.from(content ?? '')
			.toString()
			.split('\n')
			.map((it) => ({
				text: it,
			})),
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
