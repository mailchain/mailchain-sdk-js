import { MailboxOperations } from '../mailbox/mailboxOperations';
import { isActionAddSystemLabel, isActionRemoveSystemLabel } from './actions';
import { RuleApplyParams } from './mailboxRuleEngine';
import { MailboxRuleAction } from './rule';

export type ActionHandler = {
	/** ID of the action handler. Used to identify the handler and make sure no duplicate handlers are being run. */
	id: string;
	/**
	 * Try to execute the action. Regardless if the action handler applies to the action or not, it returns the params (potentially changed).
	 */
	execute: (params: RuleApplyParams, action: MailboxRuleAction<unknown>) => Promise<RuleApplyParams>;
};

/**
 * Apply actions to a message.
 * Actions are applied in order.
 *
 * @param params The message to apply actions to
 * @param action The action to apply
 * @param actionHandlers The action handlers responsible for applying the actions
 * @returns The message with actions applied
 */
export async function actionsRunner(
	params: RuleApplyParams,
	actions: MailboxRuleAction<unknown>[],
	actionHandlers: ActionHandler[],
): Promise<RuleApplyParams> {
	let outputParams = params;
	for (const action of actions) {
		for (const actionHandler of actionHandlers) {
			outputParams = await actionHandler.execute(outputParams, action);
		}
	}
	return outputParams;
}

/**
 * Create an action handler that adds a system label.
 *
 * @param mailboxOperations Mailbox operations to use when applying the action
 * @returns The action handler
 */
export function createAddSystemLabelActionHandler(mailboxOperations: MailboxOperations): ActionHandler {
	return {
		id: 'addSystemLabel',
		execute: async (params: RuleApplyParams, action: MailboxRuleAction<unknown>): Promise<RuleApplyParams> => {
			if (!isActionAddSystemLabel(action)) return params;

			if (params.message.systemLabels.includes(action.value)) return params;
			await mailboxOperations.modifySystemLabel(params.message.messageId, action.value, true);

			// Optimistic logic, not sure if the frontend should even try to do it.
			// Maybe the backend should do it and return the new systemLabels?
			return {
				...params,
				message: { ...params.message, systemLabels: [...params.message.systemLabels, action.value] },
			};
		},
	};
}

/**
 * Create an action handler that removes a system label.
 *
 * @param mailboxOperations Mailbox operations to use when applying the action
 * @returns The action handler
 */
export function createRemoveSystemLabelActionHandler(mailboxOperations: MailboxOperations): ActionHandler {
	return {
		id: 'removeSystemLabel',
		execute: async (params: RuleApplyParams, action: MailboxRuleAction<unknown>): Promise<RuleApplyParams> => {
			if (!isActionRemoveSystemLabel(action)) return params;

			if (!params.message.systemLabels.includes(action.value)) return params;
			await mailboxOperations.modifySystemLabel(params.message.messageId, action.value, false);

			return {
				...params,
				message: {
					...params.message,
					systemLabels: params.message.systemLabels.filter((l) => l !== action.value),
				},
			};
		},
	};
}

export function defaultActionHandlers(mailboxOperations: MailboxOperations): ActionHandler[] {
	return [
		createAddSystemLabelActionHandler(mailboxOperations),
		createRemoveSystemLabelActionHandler(mailboxOperations),
	];
}
