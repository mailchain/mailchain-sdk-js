import { mock, mockFn } from 'jest-mock-extended';
import { MessagePreview } from '../mailbox/types';
import { ConditionHandler } from './conditionsHandler';
import { ActionHandler } from './actionsHandler';
import { MailboxRuleEngine, RuleApplyParams, RulesSource } from './mailboxRuleEngine';
import { MailboxRule, MailboxRuleAction, MailboxRuleCondition } from './rule';

const mockConditionRunner = jest.fn();
jest.mock('./conditionsHandler', () => ({
	conditionsRunner: (...args: any[]) => mockConditionRunner(...args),
}));

const mockActionRunner = jest.fn();
jest.mock('./actionsHandler', () => ({
	actionsRunner: (...args: any[]) => mockActionRunner(...args),
}));

const mockParams: RuleApplyParams = { message: { messageId: 'messageId-original' } as MessagePreview };
const mockModifiedParams: RuleApplyParams = { message: { messageId: 'messageId-modified' } as MessagePreview };

describe('MailboxRuleEngine', () => {
	const conditionHandlers = [mock<ConditionHandler>(), mock<ConditionHandler>()];
	const actionsHandlers = [mock<ActionHandler>(), mock<ActionHandler>()];
	const rulesSource = mockFn<RulesSource>();
	let mailboxRuleEngine: MailboxRuleEngine;

	const mockCondition: MailboxRuleCondition<unknown> = { type: 'test-condition', value: 'value' };
	const mockAction: MailboxRuleAction<unknown> = { type: 'test-action', value: 'value' };
	let mockRule: MailboxRule<unknown, unknown>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockRule = {
			id: 'id',
			name: 'name',
			isEnabled: () => Promise.resolve(true),
			condition: () => Promise.resolve(mockCondition),
			actions: () => Promise.resolve([mockAction]),
		};

		rulesSource.mockResolvedValue([mockRule]);
		mailboxRuleEngine = new MailboxRuleEngine(rulesSource);

		mailboxRuleEngine.addConditionHandler(...conditionHandlers);
		mailboxRuleEngine.addActionHandler(...actionsHandlers);
	});

	it('should apply rules to a message', async () => {
		mockConditionRunner.mockResolvedValue(true);
		mockActionRunner.mockResolvedValue(mockModifiedParams);

		const result = await mailboxRuleEngine.apply(mockParams);

		expect(result).toEqual(mockModifiedParams);
		expect(mockConditionRunner).toHaveBeenCalledWith(mockParams, mockCondition, conditionHandlers);
		expect(mockActionRunner).toHaveBeenCalledWith(mockParams, [mockAction], actionsHandlers);
	});

	it('should not apply rules if the rule condition is not satisfied', async () => {
		mockConditionRunner.mockResolvedValue(false);

		const result = await mailboxRuleEngine.apply(mockParams);

		expect(result).toEqual(mockParams);
		expect(mockConditionRunner).toHaveBeenCalledWith(mockParams, mockCondition, conditionHandlers);
		expect(mockActionRunner).not.toHaveBeenCalled();
	});

	it('should not apply rules if the rule is disabled', async () => {
		mockRule.isEnabled = () => Promise.resolve(false);

		const result = await mailboxRuleEngine.apply(mockParams);

		expect(result).toEqual(mockParams);
		expect(mockConditionRunner).not.toHaveBeenCalled();
		expect(mockActionRunner).not.toHaveBeenCalled();
	});

	it('should stop applying rules if the rule has stopFurtherProcessing set to true', async () => {
		mockConditionRunner.mockResolvedValue(true);
		const mockRule2: MailboxRule<unknown, unknown> = { ...mockRule, id: 'id2' };
		mockRule.stopFurtherProcessing = true;
		rulesSource.mockResolvedValue([mockRule, mockRule2]);
		mockActionRunner.mockResolvedValue(mockModifiedParams);

		const result = await mailboxRuleEngine.apply(mockParams);

		expect(result).toEqual(mockModifiedParams);
		expect(mockConditionRunner).toHaveBeenCalledWith(mockParams, mockCondition, conditionHandlers);
		expect(mockActionRunner).toHaveBeenCalledWith(mockParams, [mockAction], actionsHandlers);
		expect(mockConditionRunner).not.toHaveBeenCalledWith(mockModifiedParams, mockCondition, conditionHandlers);
		expect(mockActionRunner).not.toHaveBeenCalledWith(mockModifiedParams, [mockAction], actionsHandlers);
	});

	it('should replace condition handler with same id', async () => {
		conditionHandlers[0].id = 'id1';
		const newConditionHandler = mock<ConditionHandler>();
		newConditionHandler.id = 'id1';

		mailboxRuleEngine.addConditionHandler(newConditionHandler);

		await mailboxRuleEngine.apply(mockParams);

		const conditionRunnerArgs = mockConditionRunner.mock.calls[0];
		expect(conditionRunnerArgs[2]).toEqual([newConditionHandler, conditionHandlers[1]]);
	});

	it('should replace action handlers with same id', async () => {
		mockConditionRunner.mockResolvedValue(true);
		actionsHandlers[0].id = 'id1';
		const newActionHandler = mock<ActionHandler>();
		newActionHandler.id = 'id1';

		mailboxRuleEngine.addActionHandler(newActionHandler);

		await mailboxRuleEngine.apply(mockParams);

		const actionRunnerArgs = mockActionRunner.mock.calls[0];
		expect(actionRunnerArgs[2]).toEqual([newActionHandler, actionsHandlers[1]]);
	});
});
