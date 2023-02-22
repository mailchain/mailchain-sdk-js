import { testRandomFunction as mockRandomFunction } from '@mailchain/crypto/rand.test.const';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { mock, MockProxy } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { PostDeliveryRequestResponseBody, TransportApiInterface } from '@mailchain/api';
import { DeliveryRequests, SendDeliveryRequestsForPayloadResult } from './deliveryRequests';

const aliceMessagingKey = aliceKeyRing.accountMessagingKey().publicKey;

const bobMessagingKey = bobKeyRing.accountMessagingKey().publicKey;

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
	let deliveryRequests: DeliveryRequests;
	let mockTransportApi: MockProxy<TransportApiInterface>;

	beforeAll(() => {
		mockTransportApi = mock();
		deliveryRequests = new DeliveryRequests(mockTransportApi);
	});

	// test('sends multiple payload to multiple recipients', async () => {
	// 	const mockPerformDelivery = jest.spyOn(PayloadSender.prototype as any, 'performDelivery');
	// 	const firstDelivery = [
	// 		{ status: 'success', deliveryRequestId: '1', recipient: {} },
	// 		{ status: 'success', deliveryRequestId: '2', recipient: {} },
	// 	];
	// 	const secondDelivery = [
	// 		{ status: 'fail', cause: new Error('cause'), recipient: {} },
	// 		{ status: 'success', deliveryRequestId: '3', recipient: {} },
	// 	];
	// 	const thirdDelivery = [{ status: 'fail', cause: new Error('cause'), recipient: {} }];
	// 	mockPerformDelivery
	// 		.mockResolvedValueOnce(firstDelivery)
	// 		.mockResolvedValueOnce(secondDelivery)
	// 		.mockResolvedValueOnce(thirdDelivery);

	// 	const result = await sender.send([
	// 		{
	// 			/** params not important since mock impl for 'performDelivery' */
	// 		} as SendPayloadParams,
	// 		{} as SendPayloadParams,
	// 		{} as SendPayloadParams,
	// 	]);

	// 	expect(mockPerformDelivery).toHaveBeenCalledTimes(3);
	// 	expect(result).toEqual([...firstDelivery, ...secondDelivery, ...thirdDelivery]);
	// });

	test('success sends single payload to multiple recipient', async () => {
		mockTransportApi.postDeliveryRequest
			.mockResolvedValueOnce({
				data: {
					deliveryRequestID: 'deliveryRequestIDValueAlice',
				} as PostDeliveryRequestResponseBody,
			} as AxiosResponse)
			.mockResolvedValueOnce({
				data: {
					deliveryRequestID: 'deliveryRequestIDValueBob',
				} as PostDeliveryRequestResponseBody,
			} as AxiosResponse);

		const result = await deliveryRequests.sendManyPayloadDeliveryRequests({
			payloadRootEncryptionKey,
			payloadUri: 'https://domain/encrypted-location',
			recipients: [aliceMessagingKey, bobMessagingKey],
		});

		expect(result).toEqual({
			status: 'success',
			failed: [],
			succeeded: [
				{
					deliveryRequestId: 'deliveryRequestIDValueAlice',
					recipientMessageKey: aliceMessagingKey,
					status: 'success',
				},
				{
					deliveryRequestId: 'deliveryRequestIDValueBob',
					recipientMessageKey: bobMessagingKey,
					status: 'success',
				},
			],
		} as SendDeliveryRequestsForPayloadResult);
		expect(mockTransportApi.postDeliveryRequest).toHaveBeenCalledTimes(2);
	});
});

describe('sendPayloadDeliveryRequest', () => {
	test('successfully notifies recipients', async () => {
		const mockTransportApi = mock<TransportApiInterface>();
		mockTransportApi.postDeliveryRequest.mockResolvedValue({
			data: {
				deliveryRequestID: 'deliveryRequestIDValue',
			} as PostDeliveryRequestResponseBody,
		} as AxiosResponse);

		const target = new DeliveryRequests(mockTransportApi);
		const result = await target.sendPayloadDeliveryRequest({
			recipientMessageKey: aliceMessagingKey,
			payloadUri: 'https://domain/encrypted-location',
			payloadRootEncryptionKey,
		});

		expect(result).toEqual({
			deliveryRequestId: 'deliveryRequestIDValue',
			recipientMessageKey: aliceMessagingKey,
			status: 'success',
		});
		expect(mockTransportApi.postDeliveryRequest).toHaveBeenCalledTimes(1);
	});
});
