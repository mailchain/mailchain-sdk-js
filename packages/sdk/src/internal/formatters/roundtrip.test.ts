import { createMimeMessage } from './generate';
import { parseMimeText } from './parse';
import { MailData } from './types';

const sampleTexts = [
	'Lorem ipsum dolor sit amet',
	'Лорем ипсум долор сит амет',
	'Λορεμ ιπσθμ δολορ σιτ αμετ',
	'側経意責家方家閉討店暖育田庁載社転線宇',
	'पढाए हिंदी रहारुप अनुवाद',
	'واعتلاء. انه كل وإقامة الموا',
	'אל אינו כלכלה שתי',
	'լոռեմ իպսում դոլոռ սիթ ամեթ',
	'🐺🏢🔹🔯🍵 🕒🌐📚🍤💀👾',
] as const;

describe('roundtrip createMimeMessage -> parseMimeText', () => {
	const mailData: MailData = {
		date: new Date('2022-06-06'),
		id: '123@mailchain.local',
		from: { address: '1337@mailchain.com', name: '1337' },
		replyTo: { address: '7331@mailchain.com', name: '7311' },
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
		subject: 'LoremЛоремΛορεμ側経意セムレ발전을रहारुपكلאינוդոլոռ🐺🏢🔹🔯',
		message: sampleTexts.map((it) => `<p>${it}</p>`).join(''),
		plainTextMessage: sampleTexts.join('\n'),
	};

	it('should create ORIGINAL mime mail message and parse it its entirety', async () => {
		const messages = await createMimeMessage(mailData);

		const result = await parseMimeText(messages.original);

		expect(result).toEqual(mailData);
	});

	it('should create mime mail message for visible recipients and parse it', async () => {
		const messages = await createMimeMessage(mailData);

		const result = await parseMimeText(messages.visibleRecipients);

		expect(result).toEqual({ ...mailData, blindCarbonCopyRecipients: [] });
	});

	it('should create mime mail message for blind recipients and parse it', async () => {
		const messages = await createMimeMessage(mailData);

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
