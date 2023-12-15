import { mock } from 'jest-mock-extended';
import { InboxApiInterface, PostPayloadResponseBody } from '@mailchain/api';
import { AxiosResponse } from 'axios';
import { Payload } from '../../transport';
import { MessageCrypto } from '../messageCrypto';
import { MailchainPayloadStorage } from './mailchainPayloadStorage';

describe('MailchainPayloadStorage', () => {
	const aliceMessageCrypto = mock<MessageCrypto>();
	const mockInboxApi = mock<InboxApiInterface>();
	const mockPayload = {} as Payload;

	const mailchainPayloadStorage = new MailchainPayloadStorage(aliceMessageCrypto, mockInboxApi);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should store payload', async () => {
		aliceMessageCrypto.encrypt.mockResolvedValue(new Uint8Array([1, 3, 3, 7]));
		mockInboxApi.postEncryptedMessageBody.mockResolvedValue({
			data: { resourceId: 'mockId' },
		} as AxiosResponse<PostPayloadResponseBody>);

		const result = await mailchainPayloadStorage.storePayload(mockPayload);

		expect(result).toBe('mockId');
		expect(aliceMessageCrypto.encrypt).toHaveBeenCalledWith(mockPayload);
		expect(mockInboxApi.postEncryptedMessageBody).toHaveBeenCalledWith(new Uint8Array([1, 3, 3, 7]));
	});

	it('should get payload', async () => {
		mockInboxApi.getEncryptedMessageBody.mockResolvedValue({
			data: new Uint8Array([1, 3, 3, 7]),
		} as AxiosResponse<object>);
		aliceMessageCrypto.decrypt.mockResolvedValue(mockPayload);

		const result = await mailchainPayloadStorage.getPayload('mockMessageId', 'mockResourceId');

		expect(result).toEqual(mockPayload);
		expect(mockInboxApi.getEncryptedMessageBody).toHaveBeenCalledWith('mockMessageId', {
			responseType: 'arraybuffer',
		});
		expect(aliceMessageCrypto.decrypt).toHaveBeenCalledWith(new Uint8Array([1, 3, 3, 7]));
	});
});
