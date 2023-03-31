import { mock, MockProxy } from 'jest-mock-extended';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { ED25519ExtendedPrivateKey, secureRandom } from '@mailchain/crypto';
import { encodeBase64 } from '@mailchain/encoding';
import flatten from 'lodash/flatten';
import { ProtocolNotSupportedError } from '@mailchain/addressing';
import { MessagingKeys, ResolvedAddress } from '../../messagingKeys';
import { dummyMailData, dummyMailDataResolvedAddresses } from '../../test.const';
import { MailDistribution, Payload, MailSenderVerifier } from '../../transport';
import { SentDeliveryRequest } from '../deliveryRequests';
import { MailDistributor } from './distributor';
import { MailDeliveryRequests, SentMailDeliveryRequests } from './deliveryRequests';
import { MailPayloadSender, PreparedDistribution, PreparedDistributions } from './payloadSender';

const dummyPayload = { Content: Buffer.from('Payload') } as Payload;

describe('MailDistributor', () => {
	let mockMailPayloadSender: MockProxy<MailPayloadSender>;
	let mockMessagingKeys: MockProxy<MessagingKeys>;
	let mockMailDeliveryRequests: MockProxy<MailDeliveryRequests>;
	let mockMailSenderVerifier: MockProxy<MailSenderVerifier>;
	let mailDistributor: MailDistributor;

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
		mailDistributor = new MailDistributor(mockMailPayloadSender, mockMailDeliveryRequests);
	});

	it('should send the distributions via payload sender', async () => {
		mockMailSenderVerifier.verifySenderOwnsFromAddress.mockResolvedValue(true);
		mockMailPayloadSender.prepareDistributions.mockImplementation(async (distributions: MailDistribution[]) => {
			return {
				data: distributions.map((distribution) => ({
					distribution,
					preparedPayload: {
						payloadUri: 'payloadUri',
						payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(AliceED25519PrivateKey),
					},
				})) as PreparedDistributions,
			};
		});

		const distributions: MailDistribution[] = [
			{
				recipients: [...dummyMailData.recipients, ...dummyMailData.carbonCopyRecipients],
				payload: dummyPayload,
			},
			{
				recipients: dummyMailData.blindCarbonCopyRecipients,
				payload: dummyPayload,
			},
		];

		mockMailDeliveryRequests.sendMailDeliveryRequests.mockImplementation(
			async (params: {
				distributions: PreparedDistribution[];
				resolvedAddresses: Map<string, ResolvedAddress>;
			}) => {
				return {
					data: flatten(
						params.distributions.map((distribution) =>
							distribution.distribution.recipients.map((recipient) => {
								return {
									deliveryRequestId: encodeBase64(secureRandom()),
									recipientMessageKey:
										params.resolvedAddresses.get(recipient.address)?.messagingKey ??
										fail(`invalid mock call with address [${recipient.address}]`),
								} as SentDeliveryRequest;
							}),
						),
					) as SentMailDeliveryRequests,
				};
			},
		);

		const { data: deliveries, error } = await mailDistributor.distributeMail({
			distributions,
			resolvedAddresses: dummyMailDataResolvedAddresses,
		});

		expect(error).toBeUndefined();

		expect(mockMailDeliveryRequests.sendMailDeliveryRequests).toHaveBeenCalledTimes(1);
		expect(deliveries).toHaveLength(7);

		for (const delivery of deliveries!) {
			expect([...dummyMailDataResolvedAddresses.values()].map((r) => r.messagingKey)).toContain(
				delivery.recipientMessageKey,
			);
			expect(delivery.deliveryRequestId).toBeDefined();
		}
	});
});
