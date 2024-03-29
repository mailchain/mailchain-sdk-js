import { mock, MockProxy } from 'jest-mock-extended';
import { aliceKeyRing } from '@mailchain/keyring/test.const';
import { ProtocolNotSupportedError } from '@mailchain/addressing';
import { MessagingKeys } from '../../messagingKeys';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../test.const';
import { Payload, SenderVerifier } from '../../transport';
import { MailPreparer } from './prepare';

const dummyPayload = { Content: Buffer.from('Payload') } as Payload;
const dummyPayload1 = { Content: Buffer.from('Payload1') } as Payload;
const dummyPayload2 = { Content: Buffer.from('Payload2') } as Payload;

const mockCreateMailPayloads = jest.fn();
const dummyDistributions = [
	{
		recipients: [...dummyMailData.recipients, ...dummyMailData.carbonCopyRecipients],
		payload: dummyPayload1,
	},
	{
		recipients: [...dummyMailData.blindCarbonCopyRecipients],
		payload: dummyPayload2,
	},
];
mockCreateMailPayloads.mockResolvedValue({
	// Just some mock data to validate the behavior, no special/complex logic going on
	original: dummyPayload,
	distributions: dummyDistributions,
});
jest.mock('./payloads', () => ({
	createMailPayloads: (...params: any[]) => mockCreateMailPayloads(...params),
}));

describe('MailPreparer', () => {
	let mockMessagingKeys: MockProxy<MessagingKeys>;
	let mockSenderVerifier: MockProxy<SenderVerifier>;
	let mailPreparer: MailPreparer;

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});

	beforeEach(() => {
		mockMessagingKeys = mock();
		mockMessagingKeys.resolve.mockImplementation(async (address) => {
			const resolvedAddress = dummyMailDataResolvedAddresses.get(address);
			return resolvedAddress
				? { data: resolvedAddress }
				: { error: new ProtocolNotSupportedError(`invalid mock call with address [${address}]`) };
		});

		mockSenderVerifier = mock();
		mailPreparer = new MailPreparer(mockMessagingKeys, mockSenderVerifier);
	});

	it('should prepare distributions for sending', async () => {
		mockMessagingKeys.resolveMany.mockResolvedValue({
			data: dummyMailDataResolvedAddresses,
		});
		mockSenderVerifier.verifySenderOwnsFromAddress.mockResolvedValue(true);

		const { data, error } = await mailPreparer.prepareMail({
			message: dummyMailData,
			senderMessagingKey: aliceKeyRing.accountMessagingKey(),
			payloadPluginHeaders: {
				customPlugin: {
					value: 'value',
				},
			},
		});

		expect(error).toBeUndefined();
		expect(data?.message).toEqual(dummyPayload);
		expect(data?.distributions).toEqual(dummyDistributions);
		expect(data?.resolvedAddresses).toEqual(dummyMailDataResolvedAddresses);

		const [calledAccountMessagingKey, calledAddressIdentityKeys, calledMailData, calledPayloadPluginHeaders] =
			mockCreateMailPayloads.mock.calls[0];
		expect(calledAccountMessagingKey.publicKey).toEqual(aliceKeyRing.accountMessagingKey().publicKey);
		expect(calledAddressIdentityKeys).toEqual(dummyMailDataResolvedAddresses);
		expect(calledMailData).toEqual(dummyMailData);
		expect(calledPayloadPluginHeaders).toEqual({
			customPlugin: {
				value: 'value',
			},
		});
	});
});
