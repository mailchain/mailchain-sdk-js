import uniq from 'lodash/uniq.js';
import { UserProfile } from '../user';
import { ConditionIsFromAddress, conditionIsFromAddress, conditionOperationOr } from './conditions';
import { MailboxRule, MailboxRuleAction, MailboxRuleCondition } from './rule';
import { actionAddSystemLabel } from './actions';

/**
 * Mailchain default rule that uses the user blocklist to mark messages as spam
 */
export class MailchainUserBlocklistRule implements MailboxRule<unknown, unknown> {
	static id = 'user-blocklist-rule';
	id: string = MailchainUserBlocklistRule.id;
	readonly name = 'User Blocklist';
	constructor(private readonly userProfile: UserProfile) {}

	static create(userProfile: UserProfile) {
		return new MailchainUserBlocklistRule(userProfile);
	}

	isEnabled(): Promise<boolean> {
		// Note: Future implementations might want to allow users to disable this rule. For now, it's always enabled.
		// Idea: return this.userProfile.getSetting(`${this.id}-enabled`).then((enabled) => enabled.value === 'true');
		return Promise.resolve(true);
	}

	async condition(): Promise<MailboxRuleCondition<unknown>> {
		const blocklistEntries = await this.getBlocklistEntries();
		return conditionOperationOr(blocklistEntries.map((blockEntry) => conditionIsFromAddress(blockEntry)));
	}

	async actions(): Promise<MailboxRuleAction<unknown>[]> {
		return Promise.resolve([actionAddSystemLabel('spam')]);
	}

	public async addBlocklistEntry(
		blockEntry: ConditionIsFromAddress['value'],
	): Promise<ConditionIsFromAddress['value'][]> {
		const newEntries = uniq([...(await this.getBlocklistEntries()), blockEntry]);
		await this.userProfile.setSetting(`${this.id}-data`, JSON.stringify(newEntries), {
			secure: true,
		});
		return newEntries;
	}

	public async removeBlocklistEntry(
		blockEntry: ConditionIsFromAddress['value'],
	): Promise<ConditionIsFromAddress['value'][]> {
		const newEntries = (await this.getBlocklistEntries()).filter((entry) => entry !== blockEntry);
		await this.userProfile.setSetting(`${this.id}-data`, JSON.stringify(newEntries), {
			secure: true,
		});
		return newEntries;
	}

	public async getBlocklistEntries(): Promise<ConditionIsFromAddress['value'][]> {
		const items = await this.userProfile.getSetting(`${this.id}-data`);
		if (!items?.isSet || items.value == null) return [];
		return JSON.parse(items.value);
	}
}
