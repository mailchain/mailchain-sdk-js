export type MailboxRuleCondition<V> = {
	type: string;
	value: V;
};

export type MailboxRuleAction<V> = {
	type: string;
	value: V;
};

export type MailboxRule<C, A> = {
	id: string;
	name: string;
	isEnabled: () => Promise<boolean>;
	condition: () => Promise<MailboxRuleCondition<C>>;
	actions: () => Promise<MailboxRuleAction<A>[]>;
	stopFurtherProcessing?: boolean;
};
