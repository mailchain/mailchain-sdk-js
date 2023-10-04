import { AxiosInstance } from 'axios';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto';
import { mock, MockProxy } from 'jest-mock-extended';
import { BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { createPayload } from '../../sending/payload';
import { PayloadReceiver, ReceivedPayload } from '../payload';
import { DeliveryRequests } from '../deliveryRequests';
import { PayloadOriginVerifier } from '../../transport/payload/verifier';
import { createMimeMessage } from '../../formatters/generate';
import { serializeAndEncryptPayload } from '../../transport';

const mockAxios: MockProxy<AxiosInstance> = mock();
const mockDeliveryRequests: MockProxy<DeliveryRequests> = mock();
const mockPayloadOriginVerifier: MockProxy<PayloadOriginVerifier> = mock();
const mailData = {
	blindCarbonCopyRecipients: [],
	carbonCopyRecipients: [],
	date: new Date('2020-01-01T00:00:00.000Z'),
	from: {
		name: 'sender',
		address: 'sender@mailchain.com',
	},
	id: '123',
	message: '</p>hello Alice</p>',
	plainTextMessage: 'hello Alice',
	recipients: [
		{
			address: 'alice@mailchain.com',
			name: 'alice',
		},
	],
	subject: 'hello',
};
describe('Receiving payload tests', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	it('alice receives messages', async () => {
		const message = await createMimeMessage(mailData, new Map());

		const payload = await createPayload(
			BobED25519PrivateKey,
			Buffer.from(message.original),
			'application/vnd.mailchain.verified-credential-request',
		);

		const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.generate());

		const serializedContent = await serializeAndEncryptPayload(payload, payloadRootEncryptionKey);

		mockAxios.get.mockResolvedValue({
			data: serializedContent,
		});

		const expected = {
			status: 'success',
			payload,
		} as ReceivedPayload;

		await testReceive(payloadRootEncryptionKey, expected);
	});
});

async function testReceive(payloadRootEncryptionKey: ED25519ExtendedPrivateKey, expected: ReceivedPayload) {
	const receiver = new PayloadReceiver(mockDeliveryRequests, mockPayloadOriginVerifier, mockAxios);
	const result = await receiver.get(payloadRootEncryptionKey, 'http://example.com');

	expect(result).toEqual(expected);
}
