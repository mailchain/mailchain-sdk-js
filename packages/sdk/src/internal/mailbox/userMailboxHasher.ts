import { encodePublicKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import { sha3_256 } from '@noble/hashes/sha3';
import { UserMailbox } from '../user/types';

export type UserMailboxHasher = (userMailbox: UserMailbox) => Promise<Uint8Array>;

export function createMailchainUserMailboxHasher(keyRing: KeyRing): UserMailboxHasher {
	return async (userMailbox) =>
		sha3_256(await keyRing.accountIdentityKey().sign(encodePublicKey(userMailbox.identityKey)));
}
