import { isSameAddress } from '@mailchain/addressing';
import uniqWith from 'lodash/unionWith';
import { Alias } from './types';

/**
 * Consolidate the provided aliases with the following rules:
 * - There can be only single alias per `address`. If there are duplicates, only the first one in the entries is kept, the others are ignored.
 */
export function consolidateMailboxAliases(aliases: [Alias, ...Alias[]]): [Alias, ...Alias[]] {
	return uniqWith(aliases, (a, b) => isSameAddress(a.address, b.address)) as [Alias, ...Alias[]];
}
