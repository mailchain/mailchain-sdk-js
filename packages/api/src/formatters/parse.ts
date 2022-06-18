import parse from 'emailjs-mime-parser';
import { NewMessageFormValues } from './generate';

export function parseMimeText(text: string): NewMessageFormValues {
	const {
		content,
		headers,
		headers: { from, to },
	} = parse(text);

	return {
		from: { label: from[0].value[0].name, value: from[0].value[0].address },
		recipients: to.map((it) => ({ label: it.value[0].name, value: it.value[0].address })),
		carbonCopyRecipients: [],
		blindCarbonCopyRecipients: [],
		subject: headers['subject']?.[0].value,
		message: Buffer.from(content)
			.toString()
			.split('\n')
			.map((it) => ({
				text: it,
			})),
	};
}
