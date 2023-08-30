import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { MockProxy, mock } from 'jest-mock-extended';
import { MAILCHAIN } from '@mailchain/addressing';
import { Payload } from '../../transport';
import { ResolvedAddress } from '../../messagingKeys';
import { DistributedPayload, PayloadDistributor } from '../distributor';
import { SentPayloadDistributionRequest } from '../deliveryRequests';
import { MailSender } from './sender';
import { MailPreparer, PreparedMail } from './prepare';

describe('MailSender.sendMail', () => {
	const mockMailPreparer: MockProxy<MailPreparer> = mock();
	const mockPayloadDistributor: MockProxy<PayloadDistributor> = mock();

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should send mail', async () => {
		mockMailPreparer.prepareMail.mockResolvedValue({
			data: {
				distributions: [],
				message: {} as Payload,
				resolvedAddresses: new Map<string, ResolvedAddress>([
					[
						'alice@mailchain.local',
						{
							messagingKey: AliceED25519PublicKey,
							identityKey: undefined,
							protocol: MAILCHAIN,
						} as ResolvedAddress,
					],
					[
						'bob@mailchain.local',
						{
							messagingKey: BobED25519PublicKey,
							identityKey: undefined,
							protocol: MAILCHAIN,
						} as ResolvedAddress,
					],
				]),
			} as PreparedMail,
		});

		mockPayloadDistributor.distributePayload.mockResolvedValue({
			data: [
				{
					deliveryRequestId: 'delivery-request-id',
					recipientMessageKey: AliceED25519PublicKey,
				} as SentPayloadDistributionRequest,
			] as DistributedPayload,
		});

		const target = new MailSender(AliceED25519PrivateKey, mockMailPreparer, mockPayloadDistributor);
		const actual = await target.sendMail({
			to: ['alice@mailchain.local'],
			from: 'bob@mailchain.local',
			content: {
				html: 'HTML',
				text: 'plain',
			},
			subject: 'subject',
		});

		expect(actual.error).toBeUndefined();

		expect(actual).toEqual({
			data: {
				sentMailDeliveryRequests: [
					{ deliveryRequestId: 'delivery-request-id', recipientMessageKey: AliceED25519PublicKey },
				],
			},
		});
	});
});
