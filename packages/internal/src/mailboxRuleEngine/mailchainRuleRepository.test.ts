import { mock, mockFn } from 'jest-mock-extended';
import { UserProfile } from '../user';
import { MailchainRuleRepository } from './mailchainRuleRepository';
import { RulesSource } from './mailboxRuleEngine';
import { MailboxRule } from './rule';

const mockPredefinedRule: MailboxRule<unknown, unknown> = {
	id: 'mock-rule',
	name: 'mock-rule',
	isEnabled: () => Promise.resolve(true),
	condition: () => Promise.resolve({ type: 'test-condition', value: 'value' }),
	actions: () => Promise.resolve([{ type: 'test-action', value: 'value' }]),
};
const mockUserRule: MailboxRule<unknown, unknown> = {
	id: 'user-rule',
	name: 'user-rule',
	isEnabled: () => Promise.resolve(true),
	condition: () => Promise.resolve({ type: 'test-condition', value: 'value' }),
	actions: () => Promise.resolve([{ type: 'test-action', value: 'value' }]),
};

describe('mailchainRuleRepository', () => {
	const mockPredefinedRules = mockFn<RulesSource>();
	const mockUserProfile = mock<UserProfile>();
	let ruleRepository: MailchainRuleRepository;

	beforeEach(async () => {
		jest.clearAllMocks();

		const mockUserRuleStr = JSON.stringify({
			id: mockUserRule.id,
			name: mockUserRule.name,
			isEnabled: await mockUserRule.isEnabled(),
			condition: await mockUserRule.condition(),
			actions: await mockUserRule.actions(),
		});

		mockPredefinedRules.mockResolvedValue([mockPredefinedRule]);
		mockUserProfile.getSettings.calledWith('user-rules').mockResolvedValue(
			new Map([
				[
					mockUserRule.id,
					{
						group: 'user-rules',
						name: mockUserRule.id,
						isSet: true,
						value: mockUserRuleStr,
						kind: 'encrypted',
					},
				],
			]),
		);
		mockUserProfile.getSetting.calledWith(mockUserRule.id).mockResolvedValue({
			group: 'user-rules',
			name: mockUserRule.id,
			isSet: true,
			value: mockUserRuleStr,
			kind: 'encrypted',
		});

		ruleRepository = new MailchainRuleRepository(mockPredefinedRules, mockUserProfile);
	});

	it('should combine predefined rules with user rules', async () => {
		const allRules = await ruleRepository.asRulesSource()();

		expect(allRules).toHaveLength(2);
		expect(allRules[0]).toEqual(mockPredefinedRule);
		expect(allRules[1].id).toEqual(mockUserRule.id);
		expect(allRules[1].name).toEqual(mockUserRule.name);
		expect(await allRules[1].isEnabled()).toEqual(await mockUserRule.isEnabled());
		expect(await allRules[1].condition()).toEqual(await mockUserRule.condition());
		expect(await allRules[1].actions()).toEqual(await mockUserRule.actions());
	});

	it('should get only user rules', async () => {
		const userRules = await ruleRepository.getUserRules();

		expect(userRules).toHaveLength(1);
		expect(userRules[0].id).toEqual(mockUserRule.id);
		expect(userRules[0].name).toEqual(mockUserRule.name);
		expect(await userRules[0].isEnabled()).toEqual(await mockUserRule.isEnabled());
		expect(await userRules[0].condition()).toEqual(await mockUserRule.condition());
		expect(await userRules[0].actions()).toEqual(await mockUserRule.actions());
	});

	it('should disable user rule', async () => {
		const resultRule = await ruleRepository.setEnabled('user-rule', false);

		expect(await resultRule.isEnabled()).toEqual(false);
		expect(mockUserProfile.setSetting).toHaveBeenCalledWith(mockUserRule.id, expect.any(String), {
			group: 'user-rules',
			secure: true,
		});
		expect(mockUserProfile.setSetting.mock.calls[0][1]).toContain('"isEnabled":false');
	});

	it('should add user rule', async () => {
		const newRuleParams = {
			name: 'new-user-rule',
			condition: { type: 'test-condition', value: 'value' },
			actions: [{ type: 'test-action', value: 'value' }],
		};
		const resultRule = await ruleRepository.addUserRule(newRuleParams);

		expect(resultRule.name).toEqual(newRuleParams.name);
		expect(await resultRule.isEnabled()).toEqual(true);
		expect(await resultRule.condition()).toEqual(newRuleParams.condition);
		expect(await resultRule.actions()).toEqual(newRuleParams.actions);
		expect(mockUserProfile.setSetting).toHaveBeenCalledWith(resultRule.id, expect.any(String), {
			group: 'user-rules',
			secure: true,
		});
		expect(JSON.parse(mockUserProfile.setSetting.mock.calls[0][1])).toEqual(
			expect.objectContaining({ ...newRuleParams, id: expect.any(String) }),
		);
	});
});
