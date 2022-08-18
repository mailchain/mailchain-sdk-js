import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { MailData } from '../../formatters/types';
import { createMailPayloads } from './payload';

const dummyMailData: MailData = {
	date: new Date('2022-06-06'),
	id: 'id',
	subject: 'subject',
	from: { name: 'from', address: 'from@mailchain.co' },
	recipients: [
		{ name: 'to1', address: 'to1@mailchain.com' },
		{ name: 'to2', address: 'to2@mailchain.com' },
	],
	carbonCopyRecipients: [
		{ name: 'cc1', address: 'cc1@mailchain.com' },
		{ name: 'cc2', address: 'cc2@mailchain.com' },
	],
	blindCarbonCopyRecipients: [
		{ name: 'bcc1', address: 'bcc1@mailchain.com' },
		{ name: 'bcc2', address: 'bcc2@mailchain.com' },
	],
	message: 'first line second line',
	plainTextMessage: 'first line second line',
};
const mockMimeMessageResult = {
	original: 'original',
	visibleRecipients: 'visible',
	blindRecipients: dummyMailData.blindCarbonCopyRecipients.map((recipient) => ({
		recipient,
		content: `content-${recipient.address}`,
	})),
};

jest.mock('@mailchain/sdk/internal/formatters/generate', () => ({
	createMimeMessage: () => mockMimeMessageResult,
}));

describe('createMailPayloads', () => {
	let keyRing: KeyRing;

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});

	beforeEach(() => {
		keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	});

	it('create correct payload for sender of the message', async () => {
		const { original } = await createMailPayloads(keyRing.accountMessagingKey(), dummyMailData);

		expect(original).toMatchSnapshot('original');
		expect(original.Content.toString()).toEqual(mockMimeMessageResult.original);
	});

	it('create correct payload for visible recipients of the message', async () => {
		const { distributions } = await createMailPayloads(keyRing.accountMessagingKey(), dummyMailData);

		expect(distributions[0].payload).toMatchSnapshot('visible');
		expect(distributions[0].payload.Content.toString()).toEqual(mockMimeMessageResult.visibleRecipients);
		expect(distributions[0].recipients).toEqual([
			...dummyMailData.recipients,
			...dummyMailData.carbonCopyRecipients,
		]);
	});

	it('create correct payload for blinded recipients of the message', async () => {
		const { distributions } = await createMailPayloads(keyRing.accountMessagingKey(), dummyMailData);

		distributions.slice(1).forEach((bccParams, index) => {
			expect(bccParams.payload).toMatchSnapshot(`blinded ${dummyMailData.blindCarbonCopyRecipients[index].name}`);
			expect(bccParams.payload.Content.toString()).toEqual(mockMimeMessageResult.blindRecipients[index].content);
			expect(bccParams.recipients[0]).toEqual(dummyMailData.blindCarbonCopyRecipients[index]);
		});
	});
});
