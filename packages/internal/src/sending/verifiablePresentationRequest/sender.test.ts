import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { mock, mockFn } from 'jest-mock-extended';
import { encodeBase64, encodeUtf8 } from '@mailchain/encoding';
import { secureRandom } from '@mailchain/crypto';
import { Payload, SenderVerifier } from '../../transport';
import { MessagingKeys, ResolvedAddress } from '../../messagingKeys';
import { DistributedPayload, PayloadDistributor } from '../distributor';
import { SentPayloadDistributionRequest } from '../deliveryRequests';
import { VerifiablePresentationRequestSender } from './sender';

const mockCreatePayload = mockFn();
const mockPayload = { Content: secureRandom() } as Payload;
mockCreatePayload.mockResolvedValue(mockPayload);
jest.mock('../payload', () => ({
	createPayload: (...args: any[]) => mockCreatePayload(...args),
}));

describe('VerifiablePresentationRequestSender.send', () => {
	const mockMessagingKeys = mock<MessagingKeys>();
	const aliceResolvedAddress = {
		mailchainAddress: 'alice@mailchian.com',
		messagingKey: AliceED25519PublicKey,
	} as ResolvedAddress;
	const bobResolvedAddress = {
		mailchainAddress: 'bob@mailchian.com',
		messagingKey: BobED25519PublicKey,
	} as ResolvedAddress;
	mockMessagingKeys.resolveMany.mockResolvedValue({
		data: new Map<string, ResolvedAddress>([
			['alice@mailchain.com', aliceResolvedAddress],
			['bob@mailchain.com', bobResolvedAddress],
		]),
	});

	const mockSenderVerifier = mock<SenderVerifier>();
	mockSenderVerifier.verifySenderOwnsFromAddress.mockResolvedValue(true);

	const mockPayloadDistributor = mock<PayloadDistributor>();
	const mockDistributedPayload = {
		deliveryRequestId: encodeBase64(secureRandom()),
		recipientMessageKey: BobED25519PublicKey,
	} as SentPayloadDistributionRequest;
	mockPayloadDistributor.distributePayload.mockResolvedValue({
		data: [mockDistributedPayload] as DistributedPayload,
	});

	let sender: VerifiablePresentationRequestSender;

	beforeEach(() => {
		jest.clearAllMocks();

		sender = new VerifiablePresentationRequestSender(
			AliceED25519PrivateKey,
			mockMessagingKeys,
			mockPayloadDistributor,
			mockSenderVerifier,
		);
	});

	it('should send mail', async () => {
		const actual = await sender.sendVerifiablePresentationRequest({
			to: 'bob@mailchain.com',
			from: 'alice@mailchain.com',
			actions: ['action-1'],
			approvedCallback: { url: 'https://example.com' },
			signedCredentialExpiresAt: new Date('2020-01-01T00:00:00Z'),
			resources: ['resource-1'],
			type: 'MailchainMessagingKeyCredential',
			version: '1.0',
		});

		expect(actual.error).toBeUndefined();

		expect(actual).toEqual({
			data: { sentDeliveryRequests: [mockDistributedPayload] },
		});
		expect(mockSenderVerifier.verifySenderOwnsFromAddress).toHaveBeenCalledWith(
			'alice@mailchain.com',
			AliceED25519PublicKey,
		);
		expect(mockMessagingKeys.resolveMany).toHaveBeenCalledWith(['alice@mailchain.com', 'bob@mailchain.com']);
		expect(mockPayloadDistributor.distributePayload).toHaveBeenCalledWith({
			distributions: [
				{
					recipients: ['bob@mailchain.com'],
					payload: mockPayload,
				},
			],
			resolvedAddresses: new Map([
				['alice@mailchain.com', aliceResolvedAddress],
				['bob@mailchain.com', bobResolvedAddress],
			]),
		});
		expect(mockCreatePayload).toHaveBeenCalledWith(
			AliceED25519PrivateKey,
			expect.any(Uint8Array),
			'application/vnd.mailchain.verified-credential-request',
		);
		expect(encodeUtf8(mockCreatePayload.mock.calls[0][1])).toMatchInlineSnapshot(
			`"{"actions":["action-1"],"approvedCallback":{"url":"https://example.com"},"from":"alice@mailchain.com","resources":["resource-1"],"signedCredentialExpiresAt":"2020-01-01T00:00:00.000Z","to":"bob@mailchain.com","type":"MailchainMessagingKeyCredential","version":"1.0"}"`,
		);
	});
});
