import { encodeBase64 } from '@mailchain/encoding';
import { secureRandom } from '@mailchain/crypto';
import { UserProfile } from '../user';
import { RulesSource } from './mailboxRuleEngine';
import { MailboxRule, MailboxRuleAction, MailboxRuleCondition } from './rule';

/**
 * Rules repository that combines predefined Mailchain rules with user defined rules.
 */
export class MailchainRuleRepository {
	constructor(private readonly predefinedRules: RulesSource, private readonly userProfile: UserProfile) {}

	static create(predefinedRules: RulesSource, userProfile: UserProfile) {
		return new MailchainRuleRepository(predefinedRules, userProfile);
	}

	/**
	 * Get rules source that combines predefined Mailchain rules with user defined rules.
	 */
	asRulesSource(): RulesSource {
		return async () => {
			const predefinedRules = await this.predefinedRules();
			const userRules = await this.getUserRules();
			return [...predefinedRules, ...userRules];
		};
	}

	/**
	 * Add a new user defined rule.
	 */
	async addUserRule(params: {
		name: string;
		condition: MailboxRuleCondition<unknown>;
		actions: MailboxRuleAction<unknown>[];
	}): Promise<MailboxRule<unknown, unknown>> {
		const id = encodeBase64(secureRandom());
		await this.userProfile.setSetting(id, JSON.stringify({ ...params, id }), {
			group: 'user-rules',
			secure: true,
		});
		return {
			id,
			name: params.name,
			isEnabled: () => Promise.resolve(true),
			condition: () => Promise.resolve(params.condition),
			actions: () => Promise.resolve(params.actions),
		};
	}

	async deleteUserRule(id: string): Promise<void> {
		return this.userProfile.deleteSetting(id);
	}

	/**
	 * Get all user defined rules.
	 */
	async getUserRules(): Promise<MailboxRule<unknown, unknown>[]> {
		const rules: MailboxRule<unknown, unknown>[] = [];
		const storedUserRules = await this.userProfile.getSettings('user-rules');
		for (const storedUserRule of storedUserRules.values()) {
			if (!storedUserRule.isSet || storedUserRule.value == null) continue;

			const parsedRule = JSON.parse(storedUserRule.value);
			rules.push({
				id: parsedRule.id,
				name: parsedRule.name,
				isEnabled: () => Promise.resolve(parsedRule.isEnabled ?? true),
				condition: () => Promise.resolve(parsedRule.condition),
				actions: () => Promise.resolve(parsedRule.actions),
			});
		}
		return rules;
	}

	/**
	 * Set enabled state of a user defined rule.
	 */
	async setEnabled(id: string, enabled: boolean): Promise<MailboxRule<unknown, unknown>> {
		const settingItem = await this.userProfile.getSetting(id);
		if (settingItem == null || !settingItem.isSet || settingItem.value == null)
			throw new Error(`Rule with id ${id} not found`);

		const parsedRule = JSON.parse(settingItem.value);
		const updatedRule = { ...parsedRule, isEnabled: enabled };
		await this.userProfile.setSetting(id, JSON.stringify(updatedRule), {
			group: 'user-rules',
			secure: true,
		});
		return {
			id,
			name: updatedRule.name,
			isEnabled: () => Promise.resolve(updatedRule.isEnabled ?? true),
			condition: () => Promise.resolve(updatedRule.condition),
			actions: () => Promise.resolve(updatedRule.actions),
		};
	}
}
