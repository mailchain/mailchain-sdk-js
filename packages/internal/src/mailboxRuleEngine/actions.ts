import { SystemMessageLabel } from '../mailbox/types';
import { MailboxRuleAction } from './rule';

/**
 * Action that should add a system label to a message.
 */
export type ActionAddSystemLabel = MailboxRuleAction<SystemMessageLabel> & {
	type: 'AddSystemLabel';
};

/**
 * Type guard for `ActionAddSystemLabel`
 */
export function isActionAddSystemLabel(action: MailboxRuleAction<unknown>): action is ActionAddSystemLabel {
	return action.type === 'AddSystemLabel';
}

/**
 * Create a `ActionAddSystemLabel` action.
 */
export function actionAddSystemLabel(label: ActionAddSystemLabel['value']): ActionAddSystemLabel {
	return {
		type: 'AddSystemLabel',
		value: label,
	};
}

/**
 * Action that should remove a system label from a message.
 */
export type ActionRemoveSystemLabel = MailboxRuleAction<SystemMessageLabel> & {
	type: 'RemoveSystemLabel';
};

/**
 * Type guard for `ActionRemoveSystemLabel`
 */
export function isActionRemoveSystemLabel(action: MailboxRuleAction<unknown>): action is ActionRemoveSystemLabel {
	return action.type === 'RemoveSystemLabel';
}

/**
 * Create a `ActionRemoveSystemLabel` action.
 */
export function actionRemoveSystemLabel(label: ActionAddSystemLabel['value']): ActionRemoveSystemLabel {
	return {
		type: 'RemoveSystemLabel',
		value: label,
	};
}
