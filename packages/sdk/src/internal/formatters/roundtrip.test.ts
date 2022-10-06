import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSR25519PublicKey, BobSR25519PublicKey } from '@mailchain/crypto/sr25519/test.const';
import {
	dummyMailData,
	dummyMailDataResolvedAddresses,
	dummyMailDataResolvedAddressesWithoutMessagingKey,
} from '../test.const';
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
		...dummyMailData,
		subject: 'LoremЛоремΛορεμ側経意セムレ발전을रहारुपكلאינוդոլոռ🐺🏢🔹🔯',
		message: sampleTexts.map((it) => `<p>${it}</p>`).join(''),
		plainTextMessage: sampleTexts.join('\n'),
	};

	it('should create ORIGINAL mime mail message and parse it its entirety', async () => {
		const messages = await createMimeMessage(mailData, dummyMailDataResolvedAddresses);

		const result = await parseMimeText(messages.original);

		expect(result.mailData).toEqual(mailData);
		expect(result.addressIdentityKeys).toEqual(dummyMailDataResolvedAddressesWithoutMessagingKey);
	});

	it('should create mime mail message for visible recipients and parse it', async () => {
		const messages = await createMimeMessage(mailData, dummyMailDataResolvedAddresses);

		const result = await parseMimeText(messages.visibleRecipients);

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
				parsed: await parseMimeText(message.content),
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
});
