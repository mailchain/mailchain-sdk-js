import { createMimeMessage } from './generate';
import { parseMimeText } from './parse';
import { MailData } from './types';

describe('roundtrip createMimeMessage -> parseMimeText', () => {
	const mailData: MailData = {
		date: new Date('2022-06-06'),
		id: '123@mailchain.local',
		from: { address: '1337@mailchain.com', name: '1337' },
		recipients: [
			{ address: 'rec1@mailchain.local', name: 'rec1' },
			{ address: 'rec2@mailchain.local', name: 'rec2' },
		],
		carbonCopyRecipients: [
			{ address: 'rec3@mailchain.local', name: 'rec3' },
			{ address: 'rec4@mailchain.local', name: 'rec4' },
		],
		blindCarbonCopyRecipients: [
			{ address: 'rec5@mailchain.local', name: 'rec5' },
			{ address: 'rec6@mailchain.local', name: 'rec6' },
		],
		subject: 'Subject',
		message: ['line 1', 'line2', '', 'line4'].join('\n'),
		plainTextMessage: ['line 1', 'line2', '', 'line4'].join('\n'),
	};

	it('should create ORIGINAL mime mail message and parse it its entirety', async () => {
		const messages = createMimeMessage(mailData);

		const result = await parseMimeText(messages.original);

		expect(result).toEqual(mailData);
	});

	it('should create mime mail message for visible recipients and parse it', async () => {
		const messages = createMimeMessage(mailData);

		const result = await parseMimeText(messages.visibleRecipients);

		expect(result).toEqual({ ...mailData, blindCarbonCopyRecipients: [] });
	});

	it('should create mime mail message for blind recipients and parse it', async () => {
		const messages = createMimeMessage(mailData);

		const resultBlind = await Promise.all(
			messages.blindRecipients.map(async (message) => ({
				recipient: message.recipient,
				parsed: await parseMimeText(message.content),
			})),
		);

		expect(resultBlind).toEqual(
			mailData.blindCarbonCopyRecipients.map((r) => ({
				recipient: r,
				parsed: { ...mailData, blindCarbonCopyRecipients: [r] },
			})),
		);
	});
});
