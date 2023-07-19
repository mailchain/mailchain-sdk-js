import { encodeBase64 } from '@mailchain/encoding';
import { secureRandom } from '@mailchain/crypto';
import { mock } from 'jest-mock-extended';
import { MessagePreview } from '../mailbox/types';
import { MailboxOperations } from '../mailbox/mailboxOperations';
import {
	ActionHandler,
	actionsRunner,
	createAddSystemLabelActionHandler,
	createRemoveSystemLabelActionHandler,
} from './actionsHandler';
import { RuleApplyParams } from './mailboxRuleEngine';
import { actionAddSystemLabel, actionRemoveSystemLabel } from './actions';

const mockParams: RuleApplyParams = { message: { messageId: encodeBase64(secureRandom()) } as MessagePreview };
const mockParams2: RuleApplyParams = { message: { messageId: encodeBase64(secureRandom()) } as MessagePreview };
const mockParams3: RuleApplyParams = { message: { messageId: encodeBase64(secureRandom()) } as MessagePreview };

const testActions = [
	{ type: 'test-action-1', value: 'test-value-1' },
	{ type: 'test-action-2', value: 'test-value-2' },
];
describe('actionsHandler', () => {
	it('should run all the actions through all the handlers', async () => {
		const mockActionHandler1 = mock<ActionHandler>();
		mockActionHandler1.execute.mockImplementation((params) => Promise.resolve(params));
		const mockActionHandler2 = mock<ActionHandler>();
		mockActionHandler2.execute.mockResolvedValueOnce(mockParams2).mockResolvedValueOnce(mockParams3);

		const outputPrams = await actionsRunner(mockParams, testActions, [mockActionHandler1, mockActionHandler2]);

		expect(mockActionHandler1.execute).toHaveBeenCalledWith(mockParams, testActions[0]);
		expect(mockActionHandler2.execute).toHaveBeenCalledWith(mockParams, testActions[0]);
		expect(mockActionHandler1.execute).toHaveBeenCalledWith(mockParams2, testActions[1]);
		expect(mockActionHandler2.execute).toHaveBeenCalledWith(mockParams2, testActions[1]);
		expect(outputPrams).toEqual(mockParams3);
	});
});

describe('addSystemLabelActionHandler', () => {
	it('should add the system label to the message', async () => {
		const testParams: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, systemLabels: [] } as MessagePreview,
		};
		const action = actionAddSystemLabel('spam');
		const mockMailboxOperations = mock<MailboxOperations>();
		const addSystemLabelActionHandler = createAddSystemLabelActionHandler(mockMailboxOperations);

		const outputPrams = await addSystemLabelActionHandler.execute(testParams, action);

		expect(outputPrams.message.systemLabels).toEqual(['spam']);
		expect(mockMailboxOperations.modifySystemLabel).toHaveBeenCalledWith(
			testParams.message.messageId,
			'spam',
			true,
		);
	});

	it('should not add the system label to the message if it is already contained', async () => {
		const testParams: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, systemLabels: ['spam'] } as MessagePreview,
		};
		const action = actionAddSystemLabel('spam');
		const mockMailboxOperations = mock<MailboxOperations>();
		const addSystemLabelActionHandler = createAddSystemLabelActionHandler(mockMailboxOperations);

		const outputPrams = await addSystemLabelActionHandler.execute(testParams, action);

		expect(outputPrams.message.systemLabels).toEqual(['spam']);
		expect(mockMailboxOperations.modifySystemLabel).not.toHaveBeenCalled();
	});
});

describe('removeSystemLabelActionHandler', () => {
	it('should remove the system label from the message', async () => {
		const testParams: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, systemLabels: ['unread'] } as MessagePreview,
		};
		const action = actionRemoveSystemLabel('unread');
		const mockMailboxOperations = mock<MailboxOperations>();
		const removeSystemLabelActionHandler = createRemoveSystemLabelActionHandler(mockMailboxOperations);

		const outputPrams = await removeSystemLabelActionHandler.execute(testParams, action);

		expect(outputPrams.message.systemLabels).toEqual([]);
		expect(mockMailboxOperations.modifySystemLabel).toHaveBeenCalledWith(
			testParams.message.messageId,
			'unread',
			false,
		);
	});

	it('should not remove the system label from the message if it is not contained', async () => {
		const testParams: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, systemLabels: [] } as MessagePreview,
		};
		const action = actionRemoveSystemLabel('unread');
		const mockMailboxOperations = mock<MailboxOperations>();
		const removeSystemLabelActionHandler = createRemoveSystemLabelActionHandler(mockMailboxOperations);

		const outputPrams = await removeSystemLabelActionHandler.execute(testParams, action);

		expect(outputPrams.message.systemLabels).toEqual([]);
		expect(mockMailboxOperations.modifySystemLabel).not.toHaveBeenCalled();
	});
});
