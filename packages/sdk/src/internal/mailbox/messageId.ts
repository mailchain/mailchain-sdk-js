import { PublicKey } from '@mailchain/crypto';
import { decodeUtf8, encodeHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { sha3_256 } from '@noble/hashes/sha3';
import { MailData } from '../formatters/types';

export type MessageIdCreator = (
	params:
		| { mailData: MailData; type: 'sent' }
		| { mailData: MailData; type: 'received'; mailbox: PublicKey; owner: string },
) => Promise<string>;

export function createMailchainMessageIdCreator(keyRing: KeyRing): MessageIdCreator {
	return async (params) => {
		const typeBytes = decodeUtf8(params.type);
		const mailIdBytes = decodeUtf8(params.mailData.id);
		const mailboxBytes = params.type === 'received' ? params.mailbox.bytes : new Uint8Array();
		const ownerBytes = params.type === 'received' ? decodeUtf8(params.owner) : new Uint8Array();

		return encodeHex(
			sha3_256(
				await keyRing
					.rootInboxKey()
					.sign(Uint8Array.from([...typeBytes, ...mailIdBytes, ...mailboxBytes, ...ownerBytes])),
			),
		);
	};
}
