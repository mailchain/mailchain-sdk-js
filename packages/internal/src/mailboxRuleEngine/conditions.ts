import { PublicKey } from '@mailchain/crypto';
import { MailboxRuleCondition } from './rule';

/**
 * Condition that checks if the message is from the given address.
 */
export type ConditionIsFromAddress = MailboxRuleCondition<string> & {
	type: 'IsFromAddress';
};

/**
 * Type guard for `ConditionIsFrom`
 */
export function isConditionIsFromAddress(
	condition: MailboxRuleCondition<unknown>,
): condition is ConditionIsFromAddress {
	return condition.type === 'IsFromAddress';
}

/**
 * Create a `ConditionIsFrom` condition.
 */
export function conditionIsFromAddress(params: ConditionIsFromAddress['value']): ConditionIsFromAddress {
	return {
		type: 'IsFromAddress',
		value: params,
	};
}

/**
 * Condition that checks if the message is from the given identity.
 */
export type ConditionIsFromIdentity = MailboxRuleCondition<PublicKey> & {
	type: 'IsFromIdentity';
};

/**
 * Type guard for `ConditionIsFromIdentity``
 */
export function isConditionIsFromIdentity(
	condition: MailboxRuleCondition<unknown>,
): condition is ConditionIsFromIdentity {
	return condition.type === 'IsFromIdentity';
}

/**
 * Create a `ConditionIsFromIdentity` condition.
 */
export function conditionIsFromIdentity(params: ConditionIsFromIdentity['value']): ConditionIsFromIdentity {
	return {
		type: 'IsFromIdentity',
		value: params,
	};
}

/**
 * Operation condition that checks if any of the conditions in the list applies. Useful for making composition of conditions.
 */
export type ConditionOperationOr = MailboxRuleCondition<MailboxRuleCondition<unknown>[]> & {
	type: 'OperationOr';
};

/**
 * Create a `ConditionOperationOr` condition.
 */
export function conditionOperationOr(conditions: MailboxRuleCondition<unknown>[]): ConditionOperationOr {
	return {
		type: 'OperationOr',
		value: conditions,
	};
}

/**
 * Type guard for `ConditionOperationOr`
 */
export function isConditionOperationOr(condition: MailboxRuleCondition<unknown>): condition is ConditionOperationOr {
	return condition.type === 'OperationOr';
}

/**
 * Operation condition that checks if all of the conditions in the list applies. Useful for making composition of conditions.
 */
export type ConditionOperationAnd = MailboxRuleCondition<MailboxRuleCondition<unknown>[]> & {
	type: 'OperationAnd';
};

/**
 * Create a `ConditionOperationAnd` condition.
 */
export function conditionOperationAnd(conditions: MailboxRuleCondition<unknown>[]): ConditionOperationAnd {
	return {
		type: 'OperationAnd',
		value: conditions,
	};
}

/**
 * Type guard for `ConditionOperationAnd`
 */
export function isConditionOperationAnd(condition: MailboxRuleCondition<unknown>): condition is ConditionOperationAnd {
	return condition.type === 'OperationAnd';
}

/**
 * Operation condition that checks if the condition does not apply. Basically, negating the wrapped condition.
 */
export type ConditionOperationNot = MailboxRuleCondition<MailboxRuleCondition<unknown>> & {
	type: 'OperationNot';
};

/**
 * Create a `ConditionOperationNot` condition.
 */
export function conditionOperationNot(condition: MailboxRuleCondition<unknown>): ConditionOperationNot {
	return {
		type: 'OperationNot',
		value: condition,
	};
}

/**
 * Type guard for `ConditionOperationNot`
 */
export function isConditionOperationNot(condition: MailboxRuleCondition<unknown>): condition is ConditionOperationNot {
	return condition.type === 'OperationNot';
}
