import { isPublicKeyEqual } from '@mailchain/crypto';
import { IdentityKeys } from '../identityKeys';
import { Configuration } from '../configuration';
import {
	isConditionIsFromAddress,
	isConditionIsFromIdentity,
	isConditionOperationAnd,
	isConditionOperationNot,
	isConditionOperationOr,
} from './conditions';
import { RuleApplyParams } from './mailboxRuleEngine';
import { MailboxRuleCondition } from './rule';

export type ConditionHandler = {
	/** ID of the condition handler. Used to identify the handler and make sure no duplicate handlers are being run. */
	id: string;
	/**
	 * Try to execute the condition. Return true if the condition applies to the message.
	 *
	 * @param params The message to apply rules to
	 * @param condition The condition to check
	 * @param checkCondition function to run the condition runner on a condition. Useful for nested conditions (ex: OR operator).
	 */
	execute: (
		params: RuleApplyParams,
		condition: MailboxRuleCondition<unknown>,
		checkCondition: (condition: MailboxRuleCondition<unknown>) => Promise<boolean>,
	) => Promise<boolean>;
};

/**
 * Check if the condition applies to the message.
 *
 * @param params The message to apply rules to
 * @param condition The condition to check
 * @param conditionHandlers The list of condition handlers to use to check the condition.
 * @returns true if the condition applies to the message
 */
export async function conditionsRunner(
	params: RuleApplyParams,
	condition: MailboxRuleCondition<unknown>,
	conditionHandlers: ConditionHandler[],
): Promise<boolean> {
	for (const conditionHandler of conditionHandlers) {
		const result = await conditionHandler.execute(params, condition, (checkCondition) =>
			conditionsRunner(params, checkCondition, conditionHandlers),
		);
		if (result) return true;
	}
	return false;
}

/**
 * Handler for condition `ConditionIsFrom` that checks if the message is from the given address.
 */
export const conditionIsFromAddressHandler: ConditionHandler = {
	id: 'conditionIsFromAddressHandler',
	execute: async (params, condition) => {
		if (!isConditionIsFromAddress(condition)) return false;
		return params.message.from === condition.value;
	},
};

/**
 * Create a handler for condition `ConditionIsFrom` that checks if the message is from the given identity.
 */
export function createConditionIsFromIdentityHandler(identityKeys: IdentityKeys): ConditionHandler {
	return {
		id: 'conditionIsFromIdentityHandler',
		execute: async (params, condition) => {
			if (!isConditionIsFromIdentity(condition)) return false;

			const fromIdentityKey = await identityKeys.resolve(params.message.from);
			if (fromIdentityKey == null) return false;
			return isPublicKeyEqual(fromIdentityKey.identityKey, condition.value);
		},
	};
}

/**
 * Handler for condition `ConditionOperationOr` that checks if any of the conditions in the list applies.
 */
export const conditionOperationOrHandler: ConditionHandler = {
	id: 'conditionOperationOrHandler',
	execute: async (_params, condition, checkCondition) => {
		if (!isConditionOperationOr(condition)) return false;

		for (const orCondition of condition.value) {
			if (await checkCondition(orCondition)) return true;
		}
		return false;
	},
};

/**
 * Handler for condition `ConditionOperationAnd` that checks if all of the conditions in the list applies.
 */
export const conditionOperationAndHandler: ConditionHandler = {
	id: 'conditionOperationAndHandler',
	execute: async (_params, condition, checkCondition) => {
		if (!isConditionOperationAnd(condition)) return false;
		for (const andCondition of condition.value) {
			if (!(await checkCondition(andCondition))) return false;
		}
		return true;
	},
};

/**
 * Handler for condition `ConditionOperationNot` that checks if the condition does not apply.
 */
export const conditionOperationNotHandler: ConditionHandler = {
	id: 'conditionOperationNotHandler',
	execute: async (_params, condition, checkCondition) => {
		if (!isConditionOperationNot(condition)) return false;
		return !(await checkCondition(condition.value));
	},
};

export function defaultConditionHandlers(sdkConfig: Configuration): ConditionHandler[] {
	return [
		conditionIsFromAddressHandler,
		createConditionIsFromIdentityHandler(IdentityKeys.create(sdkConfig)),
		conditionOperationOrHandler,
		conditionOperationAndHandler,
		conditionOperationNotHandler,
	];
}
