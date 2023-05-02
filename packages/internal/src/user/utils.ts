import { isPublicKey, PublicKey, publicKeyToBytes } from '@mailchain/crypto';
import { encodeHex } from '@mailchain/encoding';
import { UserMailbox } from './types';

export function encodeMailbox(mailbox: UserMailbox | PublicKey): string {
	let key: PublicKey;
	if (isPublicKey(mailbox)) key = mailbox;
	else key = mailbox.identityKey;

	return encodeHex(publicKeyToBytes(key));
}
