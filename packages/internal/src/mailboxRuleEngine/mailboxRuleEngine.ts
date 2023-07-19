import { MessagePreview } from '../mailbox/types';
import { MailboxRule } from './rule';
import { ConditionHandler, conditionsRunner } from './conditionsHandler';
import { ActionHandler, actionsRunner } from './actionsHandler';

export type RuleApplyParams = {
	message: MessagePreview;
};

export type RulesSource = () => Promise<MailboxRule<unknown, unknown>[]>;

/**
 * Rule engine that applies rules to messages.
 */
export class MailboxRuleEngine {
	private readonly _conditionHandlers: ConditionHandler[] = [];
	private readonly _actionHandlers: ActionHandler[] = [];
	constructor(private readonly rulesSource: RulesSource) {}

	static create(rulesSource: RulesSource) {
		return new MailboxRuleEngine(rulesSource);
	}

	/**
	 * Add a condition handler to the rule engine. Existing handlers with the same id will be replaced by the new handler.
	 */
	addConditionHandler(...handlers: ConditionHandler[]): void {
		for (const handler of handlers) {
			const existingHandlerIndex = this._conditionHandlers.findIndex((h) => h.id === handler.id);
			if (existingHandlerIndex > -1) this._conditionHandlers[existingHandlerIndex] = handler;
			else this._conditionHandlers.push(handler);
		}
	}

	/**
	 * Add an action handler to the rule engine. Existing handlers with the same id will be replaced by the new handler.
	 */
	addActionHandler(...handlers: ActionHandler[]): void {
		for (const handler of handlers) {
			const existingHandlerIndex = this._actionHandlers.findIndex((h) => h.id === handler.id);
			if (existingHandlerIndex > -1) this._actionHandlers[existingHandlerIndex] = handler;
			else this._actionHandlers.push(handler);
		}
	}

	/**
	 * Apply rules to a message.
	 * Rules are applied in order.
	 * If a rule applies, the message is modified and the next rule is applied.
	 * If no rules apply, the message is returned unmodified.
	 *
	 * @param params The message to apply rules to
	 * @returns The message with rules applied
	 */
	async apply(params: RuleApplyParams): Promise<RuleApplyParams> {
		const rules = await this.rulesSource();
		for (const rule of rules) {
			if (!(await rule.isEnabled())) continue;
			params = await this.mailboxRuleHandler(params, rule);
			if (rule.stopFurtherProcessing) break;
		}
		return params;
	}

	/**
	 * Apply a single mailbox rule to a message. If the rule applies, the message is modified.
	 *
	 * @param params The message to apply rules to
	 * @param rule The rule to apply
	 * @returns The message with rule applied
	 */
	private async mailboxRuleHandler(
		params: RuleApplyParams,
		rule: MailboxRule<unknown, unknown>,
	): Promise<RuleApplyParams> {
		const ruleCondition = await rule.condition();
		const conditionApplies = await conditionsRunner(params, ruleCondition, this._conditionHandlers);
		const ruleAction = await rule.actions();
		if (conditionApplies) return actionsRunner(params, ruleAction, this._actionHandlers);
		return params;
	}
}
