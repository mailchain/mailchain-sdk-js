import { getMimeMessage } from './generate';
import { parseMimeText } from './parse';
import { MailData } from './types';

describe('roundtrip getMimeMessage -> parseMimeText', () => {
	it('should create mime mail message and parse it', async () => {
		const mailData: MailData = {
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
			message: ['line 1', 'line2', '', 'line4'],
		};

		const mimeText = getMimeMessage(mailData);
		const result = await parseMimeText(mimeText);

		expect(result).toEqual(mailData);
	});
});
