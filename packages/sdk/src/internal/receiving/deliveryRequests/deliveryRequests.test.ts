import { AxiosResponse } from 'axios';
import { KeyRing } from '@mailchain/keyring';
import { ED25519ExtendedPrivateKey, ED25519PrivateKey } from '@mailchain/crypto';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { TransportApiInterface, GetDeliveryRequestsResponseBody } from '@mailchain/api';
import { mock, MockProxy } from 'jest-mock-extended';
import { decodeHexZeroX } from '@mailchain/encoding';
import { DeliveryRequests, UndeliveredDeliveryRequest } from './deliveryRequests';

interface TestDetails {
	name: string;
	shouldThrow?: boolean;
	initMock?: () => void;
	keyRing: KeyRing;
	expected: UndeliveredDeliveryRequest[];
}

let mockTransportApi: MockProxy<TransportApiInterface>;

describe('Receiving delivery requests', () => {
	beforeEach(() => {
		mockTransportApi = mock();
	});
	const tests: TestDetails[] = [
		{
			name: 'send empty array of payloads',
			initMock: () => {
				mockTransportApi.getDeliveryRequests.mockResolvedValue({
					data: {
						deliveryRequests: [],
					} as GetDeliveryRequestsResponseBody,
				} as AxiosResponse);
			},
			keyRing: aliceKeyRing,
			expected: [],
		},
		{
			name: 'alice receives another user message and cannot decrypt data',
			initMock: () => {
				mockTransportApi.getDeliveryRequests.mockResolvedValue({
					data: {
						deliveryRequests: [
							{
								hash: '0xc2d9b269b60304759c8d4cfc503607da152c5143b069f692f6b6cd2727c3c2b9',
								data: 'CrYCCmsr4mquWv1yzfrgfvK3uyekdMSeAslwmOY7tRT4ajCto6K774eS2ZkVdqulWLyXxeZa/nesM8hvedqoHoEvyCIF+EpbmQZbTAh5FPnuaBw8wtkkrCFM1Vd83o8AUDY4flPab5b+BPI6e/ptXBJ/K+IL2RaMbGW2LfHzRW4CNznfKxm4QCtJy/HnjtnKT2KxXoeAPbuKiLfmTs4afcG+Alo2McFKl3+1p9MzrJVn1PR6sLYHNML3iS6F9tpFdExbf6WbxcLd9fNl1uRCgmPb7XiFiMD8HmWEyBSvh4ubeG6qxyS/vvegaEq4U0x2tCJGCiHiz8E71vtthucdwPBFn+hBtgWA46Wxbccwer7pCHaDk/ESIeK4J3LNdVHlvJhncfjNMi4gqVHXUBemxQyhPGPDK9BjKA==',
							},
						],
					} as GetDeliveryRequestsResponseBody,
				} as AxiosResponse);
			},
			keyRing: aliceKeyRing,
			expected: [
				{
					cause: new Error('secretbox: could not decrypt data with private key'),
					status: 'error',
					hash: decodeHexZeroX('0xc2d9b269b60304759c8d4cfc503607da152c5143b069f692f6b6cd2727c3c2b9'),
				},
			],
		},
		{
			name: 'alice receives messages',
			initMock: () => {
				mockTransportApi.getDeliveryRequests.mockResolvedValue({
					data: {
						deliveryRequests: [
							{
								hash: '0x00000000',
								data: 'CuwBCmsr4pzb1jM5gra+HA+272Q+Cmq3yXKs3z/M0mbYtzN151k+PvoLixB9ANCsDdB6xGnKtlgufbxn50dGtpzddAsUJiKut4xXKqIze9aHje05iwJ3s2tHUxi4oN0MbnUNpEF17bXXpT9mivsvyxI1K+JgGdj4E9j0begefkRmGJeuWyx2TxvWbLmwQYkKjXT0QZbnhIHo9w8wB8t80juVoZLML/QiRgoh4hi6X9fcj1LpKlJZvVLmrsCWTU13nAHsuP3YgLvLDwuqEiHi175Gp1MsIBpx5BOFCCBh2BBDi0G5KZNsG2xLMB8hMps=',
							},
						],
					} as GetDeliveryRequestsResponseBody,
				} as AxiosResponse);
			},
			keyRing: aliceKeyRing,
			expected: [
				{
					status: 'ok',
					hash: decodeHexZeroX('0x00000000'),
					payloadUri: 'abracadabra',
					payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(
						ED25519PrivateKey.fromSecretKey(
							Uint8Array.from([
								78, 137, 46, 117, 36, 79, 240, 211, 46, 165, 198, 84, 140, 255, 38, 95, 235, 121, 115,
								216, 195, 196, 123, 185, 229, 233, 198, 194, 228, 232, 45, 166, 100, 165, 182, 109, 29,
								160, 199, 39, 195, 10, 213, 69, 101, 181, 112, 205, 121, 83, 92, 64, 76, 73, 241, 81,
								215, 81, 88, 177, 64, 131, 145, 79,
							]),
						),
					),
				},
			],
		},
		{
			name: 'bob receives user message',
			initMock: () => {
				mockTransportApi.getDeliveryRequests.mockResolvedValue({
					data: {
						deliveryRequests: [
							{
								hash: '0x00000000',
								data: 'CuwBCmsr4jhf+GW/Qhds13GbKmsWhD8eIVZWO9IbRUIY3qL5/mEqfkPgQj/ZOwyTYCbo9rN+n4ToNlO3peUGGheyjeqbMtYEqJkRUqkPT3IJPxhY4AuiASJaJSa6ocTTCY2iDrAWBC9sAexYZUdD7xI1K+LDG9kvUOz5R63ZKveVXLN108s6ivvCrX+GY7xIw1GhhX0rVGTJ0dvWRNhri0RGNUvPLWoiRgoh4pCKrlw0mwEuERWd6FHN8KUAsr/x/1GaV7OgEgLfDAcPEiHiXmP/Q1s9CVIpECLqvb8wEQn2DkVk1E0HBcFq1mje8CM=',
							},
						],
					} as GetDeliveryRequestsResponseBody,
				} as AxiosResponse);
			},
			keyRing: bobKeyRing,
			expected: [
				{
					status: 'ok',
					hash: decodeHexZeroX('0x00000000'),
					payloadUri: 'abracadabra',
					payloadRootEncryptionKey: ED25519ExtendedPrivateKey.fromPrivateKey(
						ED25519PrivateKey.fromSecretKey(
							Uint8Array.from([
								49, 7, 6, 101, 195, 70, 52, 165, 18, 224, 51, 231, 45, 8, 17, 163, 213, 132, 179, 8,
								170, 191, 7, 122, 220, 180, 253, 167, 178, 13, 20, 230, 82, 122, 6, 226, 188, 163, 27,
								7, 170, 171, 132, 236, 81, 93, 86, 0, 83, 74, 90, 69, 242, 39, 16, 128, 250, 110, 184,
								20, 171, 33, 18, 49,
							]),
						),
					),
				},
			],
		},
	];

	test.each(tests)('$name', async (test) => {
		if (test.initMock) {
			test.initMock();
		}
		const receiver = new DeliveryRequests(mockTransportApi, test.keyRing.accountMessagingKey());
		if (test.shouldThrow) {
			expect(() => {
				receiver.getUndelivered();
			}).toThrow();
		} else {
			const result = await receiver.getUndelivered();

			expect(result).toEqual(test.expected);
		}
	});
});
