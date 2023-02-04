import { testRandomFunction as mockRandomFunction } from '@mailchain/crypto/rand.test.const';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { mock, MockProxy } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { aliceKeyRing } from '@mailchain/keyring/test.const';
import { TransportApiInterface } from '@mailchain/api';
import { Payload } from '../../transport';
import { decryptPayload, deserialize } from '../../transport/serialization';
import { PayloadSender } from './send';
import { SerializableTransportPayloadHeaders } from '../../transport/payload/headers';

const payload: Payload = {
	Headers: {
		Origin: aliceKeyRing.accountMessagingKey().publicKey,
		ContentSignature: new Uint8Array([1, 3, 3, 7]),
		Created: new Date('2022-07-13T18:44:48.536Z'),
		ContentLength: 395,
		ContentType: 'message/x.mailchain',
		ContentEncoding: 'base64/plain',
		ContentEncryption: 'nacl-secret-key',
	},
	Content: Buffer.from([
		68, 97, 116, 101, 58, 32, 50, 48, 50, 50, 45, 48, 55, 45, 49, 51, 84, 49, 56, 58, 52, 52, 58, 52, 56, 46, 53,
		48, 55, 90, 13, 10, 70, 114, 111, 109, 58, 32, 34, 111, 108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109,
		97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60, 111, 108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109, 97,
		105, 108, 99, 104, 97, 105, 110, 46, 108, 111, 99, 97, 108, 62, 13, 10, 84, 111, 58, 32, 34, 111, 108, 101, 107,
		115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60, 111, 108, 101, 107,
		115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 46, 108, 111, 99, 97, 108, 62, 13,
		10, 67, 99, 58, 32, 13, 10, 77, 101, 115, 115, 97, 103, 101, 45, 73, 68, 58, 32, 50, 50, 56, 44, 51, 49, 44, 49,
		50, 54, 44, 49, 48, 48, 44, 56, 48, 44, 49, 53, 50, 44, 49, 48, 51, 44, 53, 54, 44, 57, 44, 57, 50, 44, 53, 57,
		44, 49, 56, 56, 44, 50, 51, 50, 44, 50, 52, 48, 44, 56, 57, 44, 49, 55, 57, 44, 49, 54, 49, 44, 49, 51, 52, 44,
		53, 51, 44, 50, 49, 48, 44, 49, 57, 53, 44, 50, 51, 57, 44, 49, 51, 52, 44, 50, 52, 50, 44, 49, 53, 51, 44, 50,
		53, 50, 44, 51, 54, 44, 49, 52, 56, 44, 50, 51, 57, 44, 49, 50, 51, 44, 50, 51, 48, 44, 50, 53, 64, 109, 97,
		105, 108, 99, 104, 97, 105, 110, 46, 108, 111, 99, 97, 108, 13, 10, 83, 117, 98, 106, 101, 99, 116, 58, 32, 61,
		63, 117, 116, 102, 45, 56, 63, 66, 63, 100, 51, 70, 108, 63, 61, 13, 10, 77, 73, 77, 69, 45, 86, 101, 114, 115,
		105, 111, 110, 58, 32, 49, 46, 48, 10, 67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58, 32, 116,
		101, 120, 116, 47, 112, 108, 97, 105, 110, 59, 32, 99, 104, 97, 114, 115, 101, 116, 61, 85, 84, 70, 45, 56, 13,
		10, 13, 10, 113, 119, 101,
	]),
};

jest.mock('@mailchain/crypto/rand', () => ({ secureRandom: (...params) => mockRandomFunction(...params) }));

const payloadRootEncryptionKey = ED25519ExtendedPrivateKey.fromPrivateKey(
	ED25519PrivateKey.fromSecretKey(
		Uint8Array.from([
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
			29, 30, 31, 3, 161, 7, 191, 243, 206, 16, 190, 29, 112, 221, 24, 231, 75, 192, 153, 103, 228, 214, 48, 155,
			165, 13, 95, 29, 220, 134, 100, 18, 85, 49, 184,
		]),
	),
);

describe('PayloadSender', () => {
	let sender: PayloadSender;
	let mockTransportApi: MockProxy<TransportApiInterface>;

	beforeAll(() => {
		mockTransportApi = mock();
		sender = new PayloadSender(mockTransportApi);
	});

	test('[private] createAndStorePayload successfully posts encrypted payload', async () => {
		mockTransportApi.postEncryptedPayload.mockResolvedValue({
			data: {
				uri: 'https://domain/encrypted-location',
			},
		} as AxiosResponse);

		const result = await sender.prepare(payload);

		expect(result).toEqual({
			payloadUri: 'https://domain/encrypted-location',
			payloadRootEncryptionKey,
		});
		expect(mockTransportApi.postEncryptedPayload).toHaveBeenCalledTimes(1);
		const encryptedPayload = mockTransportApi.postEncryptedPayload.mock.calls[0][0] as Buffer;
		const { headers, content } = await decryptPayload(
			deserialize(encryptedPayload),
			result.payloadRootEncryptionKey,
		);

		expect({
			Headers: SerializableTransportPayloadHeaders.FromBuffer(headers).headers,
			Content: content,
		}).toEqual(payload);
	});
});
