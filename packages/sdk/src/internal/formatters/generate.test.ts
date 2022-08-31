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
		subject: 'Subject 🤣😲🥳😲🥳🙂 大大大大',
		message: ['line 1', 'line2', '', 'line4 🤣😲🥳😲🥳🙂'].join('\n'),
		plainTextMessage: ['line 1', 'line2', '', 'line4'].join('\n'),
		date: new Date('2022-06-06'),
	};

	it('should generate correct message', async () => {
		const messages = await createMimeMessage(mailData);

		expect(removeRandomBoundaries(messages.original)).toMatchSnapshot('ORIGINAL');
		expect(removeRandomBoundaries(messages.visibleRecipients)).toMatchSnapshot('VISIBLE');
		expect(removeRandomBoundaries(messages.blindRecipients[0].content)).toMatchSnapshot(
			'BLIND rec5@mailchain.local',
		);
		expect(removeRandomBoundaries(messages.blindRecipients[1].content)).toMatchSnapshot(
			'BLIND rec6@mailchain.local',
		);
	});
});

function removeRandomBoundaries(msg: string): string {
	msg = msg.replaceAll(/boundary.*/g, `boundary="boundary"`);
	msg = msg.replaceAll(/--.*/g, `--boundary`);

	return msg;
}
