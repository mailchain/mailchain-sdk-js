import { createMimeMessage } from './generate';
import { MailData } from './types';

describe('createMimeMessage', () => {
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
		message: ['line 1', 'line2', '', 'line4'].join('\n'),
		plainTextMessage: ['line 1', 'line2', '', 'line4'].join('\n'),
	};

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it('should ', () => {
		const messages = createMimeMessage(mailData);

		expect(messages.original).toMatchSnapshot('ORIGINAL');
		expect(messages.visibleRecipients).toMatchSnapshot('VISIBLE');
		expect(messages.blindRecipients[0]).toMatchSnapshot('BLIND rec5@mailchain.local');
		expect(messages.blindRecipients[1]).toMatchSnapshot('BLIND rec6@mailchain.local');
	});
});
