import { KeyRing } from '@mailchain/keyring';
import { UserMailbox } from '../user/types';

export type UserMailboxHasher = (userMailbox: UserMailbox) => Promise<Uint8Array>;

export function createMailchainUserMailboxHasher(keyRing: KeyRing): UserMailboxHasher {
	return (userMailbox) => keyRing.accountIdentityKey().sign(userMailbox.identityKey.bytes);
}
