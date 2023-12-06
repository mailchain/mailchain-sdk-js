import { mock, MockProxy } from 'jest-mock-extended';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ED25519ExtendedPrivateKey, secureRandom } from '@mailchain/crypto';
import { encodeBase64 } from '@mailchain/encoding';
import { ProtocolNotSupportedError } from '@mailchain/addressing';
import { MessagingKeys } from '../../messagingKeys';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../test.const';
import { Distribution, Payload } from '../../transport';
import { PayloadStorer, StoredPayload } from '../payload';
import {
	PayloadDeliveryRequests,
	SendPayloadDistributionRequestsParams,
	SentPayloadDistributionRequests,
} from './deliveryRequests';
import { PayloadDistributor } from './distributor';

const dummyPayload = { Content: Buffer.from('Payload') } as Payload;

describe('MailDistributor', () => {
	let mockMailPayloadStorer: MockProxy<PayloadStorer>;
	let mockMessagingKeys: MockProxy<MessagingKeys>;
	let mockPayloadDeliveryRequests: MockProxy<PayloadDeliveryRequests>;
	let payloadDistributor: PayloadDistributor;

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

		mockMailPayloadStorer = mock();
		mockPayloadDeliveryRequests = mock();
		payloadDistributor = new PayloadDistributor(mockMailPayloadStorer, mockPayloadDeliveryRequests);
	});

	it('should send the distributions via payload sender', async () => {
		mockMailPayloadStorer.storePayload.mockImplementation(async (_payload: Payload) => {
			return {
				data: {
					payloadUri: 'payloadUri',
					payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
				} as StoredPayload,
			};
		});

		const distributions: Distribution[] = [
			{
				recipients: [
					...dummyMailData.recipients.map((x) => x.address),
					...dummyMailData.carbonCopyRecipients.map((x) => x.address),
				],
				payload: dummyPayload,
			},
			{
				recipients: dummyMailData.blindCarbonCopyRecipients.map((x) => x.address),
				payload: dummyPayload,
			},
		];

		mockPayloadDeliveryRequests.sendPayloadDistributionRequests.mockImplementation(
			async (params: SendPayloadDistributionRequestsParams) => {
				return {
					data: params.distributionRequests.flatMap((distribution) =>
						distribution.distribution.recipients.flatMap((recipient) => {
							return (
								params.resolvedAddresses.get(recipient)?.map((r) => ({
									deliveryRequestId: encodeBase64(secureRandom()),
									recipientMessageKey: r.messagingKey,
								})) ?? fail(`invalid mock call with address [${recipient}]`)
							);
						}),
					) as SentPayloadDistributionRequests,
				};
			},
		);

		const { data: deliveries, error } = await payloadDistributor.distributePayload({
			distributions,
			resolvedAddresses: dummyMailDataResolvedAddresses,
		});

		expect(error).toBeUndefined();

		expect(mockPayloadDeliveryRequests.sendPayloadDistributionRequests).toHaveBeenCalledTimes(1);
		expect(deliveries).toHaveLength(9);

		for (const delivery of deliveries!) {
			expect([...dummyMailDataResolvedAddresses.values()].flatMap((r) => r.map((x) => x.messagingKey))).toContain(
				delivery.recipientMessageKey,
			);
			expect(delivery.deliveryRequestId).toBeDefined();
		}
	});
});
