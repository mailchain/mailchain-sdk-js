import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../test.const';
import { createMailPayloads } from './payloads';

const mockMimeMessageResult = {
	original: 'original',
	visibleRecipients: 'visible',
	blindRecipients: dummyMailData.blindCarbonCopyRecipients.map((recipient) => ({
		recipient,
		content: `content-${recipient.address}`,
	})),
};

const dummyPayloadPluginHeaders = {
	customPlugin: {
		value: 'value',
	},
};

const mockCreateMimeMessage = jest.fn();
jest.mock('@mailchain/internal/formatters/generate', () => ({
	createMimeMessage: (...params: any[]) => mockCreateMimeMessage(...params),
}));

describe('createMailPayloads', () => {
	let keyRing: KeyRing;

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});

	beforeEach(() => {
		mockCreateMimeMessage.mockReturnValue(mockMimeMessageResult);
		keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	});

	it('create correct payload for sender of the message', async () => {
		const { original } = await createMailPayloads(
			keyRing.accountMessagingKey(),
			dummyMailDataResolvedAddresses,
			dummyMailData,
			dummyPayloadPluginHeaders,
		);

		expect(mockCreateMimeMessage).toHaveBeenCalledWith(dummyMailData, dummyMailDataResolvedAddresses);
		expect(original).toMatchSnapshot('original');
		expect(original.Content.toString()).toEqual(mockMimeMessageResult.original);
	});

	it('create correct payload for visible recipients of the message', async () => {
		const { distributions } = await createMailPayloads(
			keyRing.accountMessagingKey(),
			dummyMailDataResolvedAddresses,
			dummyMailData,
			dummyPayloadPluginHeaders,
		);

		expect(mockCreateMimeMessage).toHaveBeenCalledWith(dummyMailData, dummyMailDataResolvedAddresses);
		expect(distributions[0].payload).toMatchSnapshot('visible');
		expect(distributions[0].payload.Content.toString()).toEqual(mockMimeMessageResult.visibleRecipients);
		expect(distributions[0].recipients).toEqual([
			...dummyMailData.recipients.map((x) => x.address),
			...dummyMailData.carbonCopyRecipients.map((x) => x.address),
		]);
	});

	it('create correct payload for blinded recipients of the message', async () => {
		const { distributions } = await createMailPayloads(
			keyRing.accountMessagingKey(),
			dummyMailDataResolvedAddresses,
			dummyMailData,
			dummyPayloadPluginHeaders,
		);

		expect(mockCreateMimeMessage).toHaveBeenCalledWith(dummyMailData, dummyMailDataResolvedAddresses);
		distributions.slice(1).forEach((bccParams, index) => {
			expect(bccParams.payload).toMatchSnapshot(`blinded ${dummyMailData.blindCarbonCopyRecipients[index].name}`);
			expect(bccParams.payload.Content.toString()).toEqual(mockMimeMessageResult.blindRecipients[index].content);
			expect(bccParams.recipients[0]).toEqual(dummyMailData.blindCarbonCopyRecipients[index].address);
		});
	});
});
