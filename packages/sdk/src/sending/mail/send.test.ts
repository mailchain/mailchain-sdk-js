import { mock, MockProxy } from 'jest-mock-extended';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ED25519ExtendedPrivateKey, secureRandom } from '@mailchain/crypto';
import { encodeBase64 } from '@mailchain/encoding';
import { aliceKeyRing } from '@mailchain/keyring/test.const';
import flatten from 'lodash/flatten';
import { ProtocolNotSupportedError } from '@mailchain/addressing';
import { MessagingKeys, ResolvedAddress, ResolvedManyAddresses } from '../../messagingKeys';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../internal/test.const';
import {
	SendPayloadDeliveryRequestResult,
	SendPayloadDeliveryRequestResultSuccess,
} from '../deliveryRequests/deliveryRequests';
import { Distribution, Payload, MailSenderVerifier } from '../../transport';
import { MailSender } from './send';
import { MailPayloadSender, PreparedDistribution } from './payload';
import { MailDeliveryRequests, SendResult, SendResultFullyCompleted } from './deliveryRequests';

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
	let mockMailPayloadSender: MockProxy<MailPayloadSender>;
	let mockMessagingKeys: MockProxy<MessagingKeys>;
	let mockMailDeliveryRequests: MockProxy<MailDeliveryRequests>;
	let mockMailSenderVerifier: MockProxy<MailSenderVerifier>;
	let mailSender: MailSender;

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

		mockMailSenderVerifier = mock();
		mockMailPayloadSender = mock();
		mockMailDeliveryRequests = mock();
		mailSender = new MailSender(
			mockMailPayloadSender,
			mockMessagingKeys,
			mockMailSenderVerifier,
			mockMailDeliveryRequests,
		);
	});

	it('should prepare distributions for sending', async () => {
		mockMessagingKeys.resolveMany.mockResolvedValue({
			resolved: dummyMailDataResolvedAddresses,
		} as ResolvedManyAddresses);
		mockMailSenderVerifier.verifySenderOwnsFromAddress.mockResolvedValue(true);

		const result = await mailSender.prepare({
			message: dummyMailData,
			senderMessagingKey: aliceKeyRing.accountMessagingKey(),
		});

		expect(result.status).toEqual('success');
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
		mockMailSenderVerifier.verifySenderOwnsFromAddress.mockResolvedValue(true);
		mockMailPayloadSender.prepare.mockImplementation(async (distributions: Distribution[]) => {
			return {
				successfulDistributions: distributions.map((distribution) => ({
					distribution,
					preparedPayload: {
						payloadUri: 'payloadUri',
						payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
					},
				})),
				failedDistributions: [],
			};
		});

		const distributions: Distribution[] = [
			{
				recipients: [...dummyMailData.recipients, ...dummyMailData.carbonCopyRecipients],
				payload: dummyPayload,
			},
			{
				recipients: dummyMailData.blindCarbonCopyRecipients,
				payload: dummyPayload,
			},
		];

		mockMailDeliveryRequests.send.mockImplementation(
			async (
				successfulDistributions: PreparedDistribution[],
				resolvedAddresses: Map<string, ResolvedAddress>,
			) => {
				return {
					status: 'success',
					deliveries: flatten(
						successfulDistributions.map((distribution) =>
							distribution.distribution.recipients.map((recipient) => {
								return {
									status: 'success',
									deliveryRequestId: encodeBase64(secureRandom()),
									recipientMessageKey:
										resolvedAddresses.get(recipient.address)?.messagingKey ??
										fail(`invalid mock call with address [${recipient.address}]`),
								} as SendPayloadDeliveryRequestResult;
							}),
						),
					),
				} as SendResult;
			},
		);

		const result = await mailSender.send({ distributions, resolvedAddresses: dummyMailDataResolvedAddresses });

		expect(mockMailDeliveryRequests.send).toHaveBeenCalledTimes(1);
		expect(result.status).toEqual('success');
		expect(result['deliveries']).toHaveLength(7);

		const fullyCompletedResult = result as SendResultFullyCompleted;
		for (const delivery of fullyCompletedResult.deliveries) {
			expect([...dummyMailDataResolvedAddresses.values()].map((r) => r.messagingKey)).toContain(
				delivery.recipientMessageKey,
			);
			expect(delivery.status).toEqual('success');
			const successfulDelivery = delivery as SendPayloadDeliveryRequestResultSuccess;
			expect(successfulDelivery.deliveryRequestId).toBeDefined();
		}
	});
});
