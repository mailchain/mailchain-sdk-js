import { AxiosInstance } from 'axios';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { PayloadReceiver, ReceivedPayload } from '../payload';
import { DeliveryRequests } from '../deliveryRequests';
import { PayloadOriginVerifier } from '../../transport/payload/verifier';
import { createMimeMessage } from '../../internal/formatters/generate';
import { createMailPayload } from '../../sending/mail/payload';
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
		mockReset(mockAxios);
		mockReset(mockDeliveryRequests);
	});
	it('alice receives messages', async () => {
		const message = await createMimeMessage(mailData, new Map());

		const payload = await createMailPayload(BobED25519PrivateKey, message.original);

		const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(
			ED25519PrivateKey.fromSecretKey(
				Uint8Array.from([
					78, 137, 46, 117, 36, 79, 240, 211, 46, 165, 198, 84, 140, 255, 38, 95, 235, 121, 115, 216, 195,
					196, 123, 185, 229, 233, 198, 194, 228, 232, 45, 166, 100, 165, 182, 109, 29, 160, 199, 39, 195, 10,
					213, 69, 101, 181, 112, 205, 121, 83, 92, 64, 76, 73, 241, 81, 215, 81, 88, 177, 64, 131, 145, 79,
				]),
			),
		);

		const serializedContent = await serializeAndEncryptPayload(payload, payloadRootEncryptionKey);

		mockAxios.get.mockResolvedValue({
			data: serializedContent,
		});

		const expected = {
			status: 'ok',
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
