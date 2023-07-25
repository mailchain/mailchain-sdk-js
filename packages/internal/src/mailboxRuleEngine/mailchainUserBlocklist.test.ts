import { mock } from 'jest-mock-extended';
import { UserProfile } from '../user';
import { MailchainUserBlocklistRule } from './mailchainUserBlocklist';
import { isConditionOperationOr } from './conditions';

describe('mailchainUserBlocklist', () => {
	const mockUserProfile = mock<UserProfile>();
	let mailchainUserBlocklist: MailchainUserBlocklistRule;

	beforeEach(() => {
		jest.clearAllMocks();

		mockUserProfile.getSetting.calledWith(`${MailchainUserBlocklistRule.id}-data`).mockResolvedValue({
			name: `${MailchainUserBlocklistRule.id}-data`,
			group: 'generic',
			isSet: false,
			kind: 'string',
		});

		mailchainUserBlocklist = new MailchainUserBlocklistRule(mockUserProfile);
	});

	it('should add blocklist entry', async () => {
		const newEntries = await mailchainUserBlocklist.addBlocklistEntry('alice@mailchain.test');

		expect(newEntries).toEqual(['alice@mailchain.test']);
		expect(mockUserProfile.setSetting).toHaveBeenCalledWith(
			`${MailchainUserBlocklistRule.id}-data`,
			JSON.stringify(['alice@mailchain.test']),
			{ secure: true },
		);
	});

	it('should remove blocklist entry', async () => {
		mockUserProfile.getSetting.calledWith(`${MailchainUserBlocklistRule.id}-data`).mockResolvedValue({
			name: `${MailchainUserBlocklistRule.id}-data`,
			group: 'generic',
			isSet: true,
			value: JSON.stringify(['alice@mailchain.test']),
			kind: 'string',
		});

		const newEntries = await mailchainUserBlocklist.removeBlocklistEntry('alice@mailchain.test');

		expect(newEntries).toEqual([]);
		expect(mockUserProfile.setSetting).toHaveBeenCalledWith(
			`${MailchainUserBlocklistRule.id}-data`,
			JSON.stringify([]),
			{ secure: true },
		);
	});

	it('should get enabled state', async () => {
		const enabled = await mailchainUserBlocklist.isEnabled();

		expect(enabled).toEqual(true);
	});

	it('should have add spam label action', async () => {
		const actions = await mailchainUserBlocklist.actions();

		expect(actions).toEqual([{ type: 'AddSystemLabel', value: 'spam' }]);
	});

	it('should have conditions is from address for all blocklist entires', async () => {
		mockUserProfile.getSetting.calledWith(`${MailchainUserBlocklistRule.id}-data`).mockResolvedValue({
			name: `${MailchainUserBlocklistRule.id}-data`,
			group: 'generic',
			isSet: true,
			value: JSON.stringify(['alice@mailchain.test', 'bob@mailchain.test', 'rob@mailchain.test']),
			kind: 'string',
		});

		const condition = await mailchainUserBlocklist.condition();

		if (!isConditionOperationOr(condition)) return fail('condition should be an OR operation');
		expect(condition.value).toEqual([
			{ type: 'IsFromAddress', value: 'alice@mailchain.test' },
			{ type: 'IsFromAddress', value: 'bob@mailchain.test' },
			{ type: 'IsFromAddress', value: 'rob@mailchain.test' },
		]);
	});
});
