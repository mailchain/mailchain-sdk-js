import { mock } from 'jest-mock-extended';
import { Payload } from '../transport';
import { MailboxStorage } from './mailboxStorage';
import { PayloadStorage } from './payloadStorage';

describe('MailboxStorage', () => {
	const mockPayloadStorage = mock<PayloadStorage>();
	const mockPayload: Payload = {} as Payload;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw an error if no payload storage is provided', () => {
		expect(() => new MailboxStorage([] as any)).toThrow('at least one payload storage must be provided');
	});

	it('should store payload', async () => {
		mockPayloadStorage.canStorePayload.mockResolvedValue(true);
		mockPayloadStorage.storePayload.mockResolvedValue('mockId');

		const mailboxStorage = new MailboxStorage([mockPayloadStorage]);
		const result = await mailboxStorage.storePayload(mockPayload);

		expect(result).toBe('mockId');
		expect(mockPayloadStorage.canStorePayload).toHaveBeenCalledWith(mockPayload);
		expect(mockPayloadStorage.storePayload).toHaveBeenCalledWith(mockPayload);
	});

	it('should throw an error if no storage can store the payload', async () => {
		mockPayloadStorage.canStorePayload.mockResolvedValue(false);

		const mailboxStorage = new MailboxStorage([mockPayloadStorage]);

		await expect(mailboxStorage.storePayload(mockPayload)).rejects.toThrow(
			`no storage able to handle storing of payload for: ${mockPayload}`,
		);
	});

	it('should get payload', async () => {
		mockPayloadStorage.canGetPayload.mockResolvedValue(true);
		mockPayloadStorage.getPayload.mockResolvedValue(mockPayload);

		const mailboxStorage = new MailboxStorage([mockPayloadStorage]);
		const result = await mailboxStorage.getPayload('mockMessageId', 'mockResourceId');

		expect(result).toEqual(mockPayload);
		expect(mockPayloadStorage.canGetPayload).toHaveBeenCalledWith('mockMessageId', 'mockResourceId');
		expect(mockPayloadStorage.getPayload).toHaveBeenCalledWith('mockMessageId', 'mockResourceId');
	});

	it('should throw an error if no storage can get the payload', async () => {
		mockPayloadStorage.canGetPayload.mockResolvedValue(false);

		const mailboxStorage = new MailboxStorage([mockPayloadStorage]);

		await expect(mailboxStorage.getPayload('mockMessageId', 'mockResourceId')).rejects.toThrow(
			`no storage able to handle getting of payload for: mockMessageId mockResourceId`,
		);
	});
});
