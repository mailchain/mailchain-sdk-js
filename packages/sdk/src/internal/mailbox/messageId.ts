import { encodeHex } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { sha3_256 } from '@noble/hashes/sha3';
import { MailData } from '../formatters/types';

export type MessageIdCreator = (
	params: { mailData: MailData; type: 'sent' } | { mailData: MailData; type: 'received'; owner: string },
) => Promise<string>;

export function createMailchainMessageIdCreator(keyRing: KeyRing): MessageIdCreator {
	return async (params) => {
		let signContent = params.type + params.mailData.id;
		if (params.type === 'received') {
			signContent += params.owner;
		}
		return encodeHex(sha3_256(await keyRing.rootInboxKey().sign(Buffer.from(signContent))));
	};
}
