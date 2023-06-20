import { isSameAddress } from '@mailchain/addressing';
import uniqWith from 'lodash/unionWith';
import { Alias } from './types';
import { NewUserMailbox } from './userProfile';

export function consolidateMailbox(mailbox: NewUserMailbox): NewUserMailbox {
	const consolidators = [consolidateMailboxLabel, consolidateMailboxAliases];
	return consolidators.reduce((prev, consolidator) => consolidator(prev), mailbox);
}

export function consolidateMailboxLabel(mailbox: NewUserMailbox): NewUserMailbox {
	return { ...mailbox, label: mailbox.label?.trim() || null };
}

/**
 * Consolidate the provided mailbox aliases with the following rules:
 * - There can be only single alias per `address`. If there are duplicates, only the first one in the entries is kept, the others are ignored.
 * - Precaution to filter out Filecoin aliases that were artificially added because feature flag was activated. This is to be removed once Filecoin support is defined.
 */
export function consolidateMailboxAliases(mailbox: NewUserMailbox): NewUserMailbox {
	return {
		...mailbox,
		aliases: uniqWith(mailbox.aliases, (a, b) => isSameAddress(a.address, b.address)).filter(
			(alias) => !alias.address.domain.startsWith('filecoin'),
		) as [Alias, ...Alias[]],
	};
}
