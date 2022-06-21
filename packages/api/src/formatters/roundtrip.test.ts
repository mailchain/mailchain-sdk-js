import { getMimeMessage, MessageType, NewMessageFormValues } from './generate';
import { parseMimeText } from './parse';

describe('roundtrip getMimeMessage -> parseMimeText', () => {
	it('should create mime mail message and parse it', async () => {
		const expected: NewMessageFormValues = {
			type: MessageType.NEW,
			from: { value: '1337@mailchain.com', label: '1337' },
			recipients: [
				{ value: 'rec1@mailchain.local', label: 'rec1' },
				{ value: 'rec2@mailchain.local', label: 'rec2' },
			],
			carbonCopyRecipients: [],
			blindCarbonCopyRecipients: [],
			subject: 'Subject',
			message: [{ text: 'line 1' }, { text: 'line2' }, { text: '' }, { text: 'line4' }],
		};

		const mimeText = getMimeMessage(expected);
		const actual = await parseMimeText(mimeText);

		expect(actual).toEqual(expected);
	});
});
