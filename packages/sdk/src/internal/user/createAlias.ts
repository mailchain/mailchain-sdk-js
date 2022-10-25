import { MailchainAddress } from '@mailchain/addressing';
import { Alias } from './types';

export function createMailboxAlias(address: MailchainAddress, params?: Partial<Omit<Alias, 'address'>>): Alias {
	return {
		address,
		isDefault: params?.isDefault ?? false,
		allowSending: params?.allowSending ?? true,
		allowReceiving: params?.allowReceiving ?? true,
	};
}
