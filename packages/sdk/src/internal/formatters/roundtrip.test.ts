import { formatAddress } from '@mailchain/addressing';
import {
	dummyMailData,
	dummyMailDataResolvedAddresses,
	dummyMailDataResolvedAddressesWithoutMessagingKey,
} from '../test.const';
import { MailData } from '../transport';
import { AliceAccountMailbox, BobAccountMailbox } from '../user/test.const';
import { createMimeMessage } from './generate';
import { parseMimeText } from './parse';

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
	let mailData: MailData = {
		...dummyMailData,
		subject: 'LoremЛоремΛορεμ側経意セムレ발전을रहारुपكلאינוդոլոռ🐺🏢🔹🔯',
		message: sampleTexts.map((it) => `<p>${it}</p>`).join(''),
		plainTextMessage: sampleTexts.join('\n'),
	};

	it('should create ORIGINAL mime mail message and parse it its entirety', async () => {
		const messages = await createMimeMessage(mailData, dummyMailDataResolvedAddresses);

		const result = await parseMimeText({
			Content: Buffer.from(messages.original),
			Headers: { ContentType: 'message/x.mailchain' },
		} as any);

		expect(result.mailData).toEqual(mailData);
		expect(result.addressIdentityKeys).toEqual(dummyMailDataResolvedAddressesWithoutMessagingKey);
	});

	it('should create mime mail message for visible recipients and parse it', async () => {
		const messages = await createMimeMessage(mailData, dummyMailDataResolvedAddresses);

		const result = await parseMimeText({
			Content: Buffer.from(messages.visibleRecipients),
			Headers: { ContentType: 'message/x.mailchain' },
		} as any);

		expect(result.mailData).toEqual({ ...mailData, blindCarbonCopyRecipients: [] });
		const visibleIdentityKeys = new Map(dummyMailDataResolvedAddressesWithoutMessagingKey);
		dummyMailData.blindCarbonCopyRecipients.forEach(({ address }) => visibleIdentityKeys.delete(address));
		expect(result.addressIdentityKeys).toEqual(visibleIdentityKeys);
	});

	it('should create mime mail message for blind recipients and parse it', async () => {
		const messages = await createMimeMessage(mailData, dummyMailDataResolvedAddresses);

		const resultBlind = await Promise.all(
			messages.blindRecipients.map(async (message) => ({
				recipient: message.recipient,
				parsed: await parseMimeText({
					Content: Buffer.from(message.content),
					Headers: { ContentType: 'message/x.mailchain' },
				} as any),
			})),
		);

		expect(resultBlind).toEqual(
			mailData.blindCarbonCopyRecipients.map((r) => {
				const bccAddressIdentityKeys = new Map(dummyMailDataResolvedAddressesWithoutMessagingKey);
				dummyMailData.blindCarbonCopyRecipients.forEach(({ address }) => {
					if (r.address !== address) bccAddressIdentityKeys.delete(address);
				});
				return {
					recipient: r,
					parsed: {
						mailData: { ...mailData, blindCarbonCopyRecipients: [r] },
						addressIdentityKeys: bccAddressIdentityKeys,
					},
				};
			}),
		);
	});

	it('should handle unicode message participants', async () => {
		const unicodeAlice = { name: 'Алиса 👩🏼‍💻', address: '👩🏼‍💻.alice.eth@mailchain.test' };
		const unicodeBob = { name: '👨‍💻 Боб 🥸', address: '👨‍💻.боб.🥸@mailchain.test' };
		mailData = {
			...dummyMailData,
			from: unicodeAlice,
			recipients: [unicodeBob],
		};
		const identityKeys = new Map(dummyMailDataResolvedAddresses);
		identityKeys.set(
			unicodeAlice.address,
			dummyMailDataResolvedAddresses.get(formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'))!,
		);
		identityKeys.set(
			unicodeBob.address,
			dummyMailDataResolvedAddresses.get(formatAddress(BobAccountMailbox.aliases[0].address, 'mail'))!,
		);

		const { original } = await createMimeMessage(mailData, identityKeys);
		const parsed = await parseMimeText({
			Content: Buffer.from(original),
			Headers: { ContentType: 'message/x.mailchain' },
		} as any);

		expect(parsed.mailData).toEqual(mailData);
		expect(parsed.addressIdentityKeys.get(unicodeAlice.address)?.identityKey).toEqual(
			AliceAccountMailbox.identityKey,
		);
		expect(parsed.addressIdentityKeys.get(unicodeBob.address)?.identityKey).toEqual(BobAccountMailbox.identityKey);
	});
});
