import MockAdapter from 'axios-mock-adapter';
import globalAxios from 'axios';
import { KeyRing } from '@mailchain/keyring';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { MailchainAddress } from '@mailchain/internal/addressing';
import { MAILCHAIN } from '@mailchain/internal/protocols';
import { ConfigurationParameters } from '../api';
import { Configuration } from '../api/configuration';
import { EncodeHexZeroX } from '../../../encoding/src/hex';
import { PayloadForRecipient, PayloadRecipientDelivery, sendPayload } from './send';

const passthrough = false;
const mockAxiosAdapter = new MockAdapter(globalAxios, { onNoMatch: passthrough ? 'passthrough' : 'throwException' });

const mockLookupMessageKey = jest.fn();
jest.mock('../identityKeys/lookup', () => ({
	...jest.requireActual('../identityKeys/lookup'),
	lookupMessageKey: () => mockLookupMessageKey(),
}));

interface TestDetails {
	name: string;
	shouldThrow?: boolean;
	initMock?: () => void;
	keyRing: KeyRing;
	payloads: PayloadForRecipient[];
	expected: PayloadRecipientDelivery[];
}
const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:8080';

const apiConfig = new Configuration({ basePath: SERVER_URL } as ConfigurationParameters);

const VALID_ADDRESS: MailchainAddress = { value: 'alice', protocol: MAILCHAIN, domain: 'mailchain.local' };
const VALID_ADDRESS_BOB: MailchainAddress = { value: 'bob', protocol: MAILCHAIN, domain: 'mailchain.local' };
process.env.MAILCHAIN_ADDRESS_DOMAIN_NAME = 'mailchain.local';

const aliceKeyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
const bobKeyRing = KeyRing.fromPrivateKey(BobED25519PrivateKey);

const aliceMessageKey = {
	value: EncodeHexZeroX(aliceKeyRing.accountMessagingKey().publicKey.bytes),
	encoding: 'hex/0x-prefix',
	curve: 'ed25519',
};

const bobMessageKey = {
	value: EncodeHexZeroX(bobKeyRing.accountMessagingKey().publicKey.bytes),
	encoding: 'hex/0x-prefix',
	curve: 'ed25519',
};

const deliveryRequestResponse = {
	deliveryRequestID: '0x760120f7c84d249efd3b49676d7959302ec2c52eab67a4b24e32cdca55b8641f',
};

const urlResponse = { uri: 'abracadabra' };

describe('Sending tests', () => {
	beforeEach(() => {
		mockAxiosAdapter.reset();
		mockLookupMessageKey.mockClear();
	});
	let tests: TestDetails[] = [
		{
			name: 'send empty array of payloads',
			initMock: () => {
				mockLookupMessageKey.mockResolvedValue({
					messageKey: aliceMessageKey,
					address: VALID_ADDRESS,
				});
			},
			keyRing: aliceKeyRing,
			payloads: [],
			expected: [],
		},
		{
			name: 'alice sends one message',
			initMock: () => {
				mockLookupMessageKey.mockResolvedValue({
					messageKey: aliceMessageKey,
					address: VALID_ADDRESS,
				});

				mockAxiosAdapter.onPost(`${SERVER_URL}/transport/payloads`).reply(200, urlResponse);
				mockAxiosAdapter
					.onPost(`${SERVER_URL}/transport/delivery-requests`)
					.reply(200, deliveryRequestResponse);
			},
			keyRing: aliceKeyRing,
			payloads: [
				{
					recipient: { name: 'alice@mailchain', address: 'alice@mailchain.local' },
					payload: {
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
							68, 97, 116, 101, 58, 32, 50, 48, 50, 50, 45, 48, 55, 45, 49, 51, 84, 49, 56, 58, 52, 52,
							58, 52, 56, 46, 53, 48, 55, 90, 13, 10, 70, 114, 111, 109, 58, 32, 34, 111, 108, 101, 107,
							115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60,
							111, 108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105,
							110, 46, 108, 111, 99, 97, 108, 62, 13, 10, 84, 111, 58, 32, 34, 111, 108, 101, 107, 115,
							105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60, 111,
							108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110,
							46, 108, 111, 99, 97, 108, 62, 13, 10, 67, 99, 58, 32, 13, 10, 77, 101, 115, 115, 97, 103,
							101, 45, 73, 68, 58, 32, 50, 50, 56, 44, 51, 49, 44, 49, 50, 54, 44, 49, 48, 48, 44, 56, 48,
							44, 49, 53, 50, 44, 49, 48, 51, 44, 53, 54, 44, 57, 44, 57, 50, 44, 53, 57, 44, 49, 56, 56,
							44, 50, 51, 50, 44, 50, 52, 48, 44, 56, 57, 44, 49, 55, 57, 44, 49, 54, 49, 44, 49, 51, 52,
							44, 53, 51, 44, 50, 49, 48, 44, 49, 57, 53, 44, 50, 51, 57, 44, 49, 51, 52, 44, 50, 52, 50,
							44, 49, 53, 51, 44, 50, 53, 50, 44, 51, 54, 44, 49, 52, 56, 44, 50, 51, 57, 44, 49, 50, 51,
							44, 50, 51, 48, 44, 50, 53, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 46, 108, 111, 99,
							97, 108, 13, 10, 83, 117, 98, 106, 101, 99, 116, 58, 32, 61, 63, 117, 116, 102, 45, 56, 63,
							66, 63, 100, 51, 70, 108, 63, 61, 13, 10, 77, 73, 77, 69, 45, 86, 101, 114, 115, 105, 111,
							110, 58, 32, 49, 46, 48, 10, 67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58,
							32, 116, 101, 120, 116, 47, 112, 108, 97, 105, 110, 59, 32, 99, 104, 97, 114, 115, 101, 116,
							61, 85, 84, 70, 45, 56, 13, 10, 13, 10, 113, 119, 101,
						]),
					},
				},
			],
			expected: [
				{
					deliveryRequestId: '0x760120f7c84d249efd3b49676d7959302ec2c52eab67a4b24e32cdca55b8641f',
					recipient: {
						curve: 'ed25519',
						encoding: 'hex/0x-prefix',
						value: '0xd7be46a7532c201a71e41385082061d810438b41b929936c1b6c4b301f21329b',
					},
					status: 'success',
				},
			],
		},
		{
			name: 'bob sends one message',
			initMock: () => {
				mockLookupMessageKey.mockResolvedValue({
					messageKey: bobMessageKey,
					address: VALID_ADDRESS_BOB,
				});

				mockAxiosAdapter.onPost(`${SERVER_URL}/transport/payloads`).reply(200, urlResponse);

				mockAxiosAdapter
					.onPost(`${SERVER_URL}/transport/delivery-requests`)
					.reply(200, deliveryRequestResponse);
			},
			keyRing: bobKeyRing,
			payloads: [
				{
					recipient: { name: 'bob@mailchain', address: 'bob@mailchain.local' },
					payload: {
						Headers: {
							Origin: bobKeyRing.accountMessagingKey().publicKey,
							ContentSignature: new Uint8Array([1, 2, 3, 5]),
							Created: new Date('2022-07-13T18:44:48.536Z'),
							ContentLength: 395,
							ContentType: 'message/x.mailchain',
							ContentEncoding: 'base64/plain',
							ContentEncryption: 'nacl-secret-key',
						},
						Content: Buffer.from([
							68, 97, 116, 101, 58, 32, 50, 48, 50, 50, 45, 48, 55, 45, 49, 51, 84, 49, 56, 58, 52, 52,
							58, 52, 56, 46, 53, 48, 55, 90, 13, 10, 70, 114, 111, 109, 58, 32, 34, 111, 108, 101, 107,
							115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60,
							111, 108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105,
							110, 46, 108, 111, 99, 97, 108, 62, 13, 10, 84, 111, 58, 32, 34, 111, 108, 101, 107, 115,
							105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 34, 32, 60, 111,
							108, 101, 107, 115, 105, 105, 48, 48, 57, 49, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110,
							46, 108, 111, 99, 97, 108, 62, 13, 10, 67, 99, 58, 32, 13, 10, 77, 101, 115, 115, 97, 103,
							101, 45, 73, 68, 58, 32, 50, 50, 56, 44, 51, 49, 44, 49, 50, 54, 44, 49, 48, 48, 44, 56, 48,
							44, 49, 53, 50, 44, 49, 48, 51, 44, 53, 54, 44, 57, 44, 57, 50, 44, 53, 57, 44, 49, 56, 56,
							44, 50, 51, 50, 44, 50, 52, 48, 44, 56, 57, 44, 49, 55, 57, 44, 49, 54, 49, 44, 49, 51, 52,
							44, 53, 51, 44, 50, 49, 48, 44, 49, 57, 53, 44, 50, 51, 57, 44, 49, 51, 52, 44, 50, 52, 50,
							44, 49, 53, 51, 44, 50, 53, 50, 44, 51, 54, 44, 49, 52, 56, 44, 50, 51, 57, 44, 49, 50, 51,
							44, 50, 51, 48, 44, 50, 53, 64, 109, 97, 105, 108, 99, 104, 97, 105, 110, 46, 108, 111, 99,
							97, 108, 13, 10, 83, 117, 98, 106, 101, 99, 116, 58, 32, 61, 63, 117, 116, 102, 45, 56, 63,
							66, 63, 100, 51, 70, 108, 63, 61, 13, 10, 77, 73, 77, 69, 45, 86, 101, 114, 115, 105, 111,
							110, 58, 32, 49, 46, 48, 10, 67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58,
							32, 116, 101, 120, 116, 47, 112, 108, 97, 105, 110, 59, 32, 99, 104, 97, 114, 115, 101, 116,
							61, 85, 84, 70, 45, 56, 13, 10, 13, 10, 113, 119, 101,
						]),
					},
				},
			],
			expected: [
				{
					deliveryRequestId: '0x760120f7c84d249efd3b49676d7959302ec2c52eab67a4b24e32cdca55b8641f',
					recipient: {
						curve: 'ed25519',
						encoding: 'hex/0x-prefix',
						value: '0x5e63ff435b3d0952291022eabdbf301109f60e4564d44d0705c16ad668def023',
					},
					status: 'success',
				},
			],
		},
	];

	test.each(tests)('$name', async (test) => {
		if (test.initMock) {
			test.initMock();
		}
		if (test.shouldThrow) {
			expect(() => {
				sendPayload(test.keyRing, apiConfig, test.payloads);
			}).toThrow();
		} else {
			const result = await sendPayload(test.keyRing, apiConfig, test.payloads);
			expect(result).toEqual(test.expected);
		}
	});
});
