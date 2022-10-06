import { mock, MockProxy } from 'jest-mock-extended';
import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ED25519ExtendedPrivateKey, secureRandom } from '@mailchain/crypto';
import { encodeBase64 } from '@mailchain/encoding';
import { LookupResult } from '../../identityKeys';
import { PayloadSender } from '../payload/send';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../test.const';
import { Payload } from '../payload/content/payload';
import { MailSender } from './send';
import { Distribution } from './payload';

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
jest.mock('./payload', () => ({
	createMailPayloads: (...params) => mockCreateMailPayloads(...params),
}));

describe('MailSender', () => {
	const aliceKeyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

	let mockPayloadSender: MockProxy<PayloadSender>;
	let mockAddressResolver: jest.Mock<Promise<LookupResult>, [string]>;
	let mailSender: MailSender;

	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2022-06-06'));
	});

	beforeEach(() => {
		mockAddressResolver = jest.fn();
		mockAddressResolver.mockImplementation(
			async (address) =>
				dummyMailDataResolvedAddresses.get(address) ?? fail(`invalid mock call with address [${address}]`),
		);

		mockPayloadSender = mock();
		mailSender = new MailSender(mockPayloadSender, mockAddressResolver);
	});

	it('should prepare distributions for sending', async () => {
		const result = await mailSender.prepare({
			message: dummyMailData,
			senderMessagingKey: aliceKeyRing.accountMessagingKey(),
		});

		expect(result.status).toEqual('prepare-success');
		expect(result['message']).toEqual(dummyPayload);
		expect(result['distributions']).toEqual(dummyDistributions);
		expect(result['resolvedAddresses']).toEqual(dummyMailDataResolvedAddresses);

		const [calledAccountMessagingKey, calledAddressIdentityKeys, calledMailData] =
			mockCreateMailPayloads.mock.calls[0];
		expect(calledAccountMessagingKey.publicKey).toEqual(aliceKeyRing.accountMessagingKey().publicKey);
		expect(calledAddressIdentityKeys).toEqual(dummyMailDataResolvedAddresses);
		expect(calledMailData).toEqual(dummyMailData);
	});

	it('should send the distributions via payload sender', async () => {
		mockPayloadSender.prepare.mockResolvedValue({
			payloadUri: 'payloadUri',
			payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
		});
		const distributions: Distribution[] = [
			{
				recipients: [...dummyMailData.recipients, ...dummyMailData.carbonCopyRecipients],
				payload: dummyPayload,
			},
			{
				recipients: [dummyMailData.blindCarbonCopyRecipients[0]],
				payload: dummyPayload,
			},
		];
		mockPayloadSender.send.mockImplementation(async ({ recipients }) => {
			return recipients.map((recipient) => ({
				status: 'success',
				deliveryRequestId: encodeBase64(secureRandom()),
				recipient,
			}));
		});

		const result = await mailSender.send({ distributions, resolvedAddresses: dummyMailDataResolvedAddresses });

		expect(mockPayloadSender.prepare).toHaveBeenCalledWith(dummyPayload);
		expect(result.status).toEqual('success');
		expect(result['deliveries']).toHaveLength(5);
		for (const delivery of result['deliveries']) {
			expect([...dummyMailDataResolvedAddresses.values()].map((r) => r.messagingKey)).toContain(
				delivery.recipient,
			);
			expect(delivery.deliveryRequestId).toBeDefined();
		}
	});
});
