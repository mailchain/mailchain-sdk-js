import { publicKeyToBytes, PublicKey } from '@mailchain/crypto';
import { ED25519PublicKey, ED25519PublicKeyLen } from '@mailchain/crypto/ed25519';
import { SECP256K1PublicKey, SECP256K1PublicKeyLength } from '@mailchain/crypto/secp256k1/public';
import { isMailchainAccountAddress, parseNameServiceAddress } from '@mailchain/addressing';
import { IdentityKeys } from '../identityKeys';
import * as protoInbox from '../protobuf/inbox/inbox';
import { combineMigrations, MigrationRule } from '../migration';
import { Configuration } from '..';

type MessagePreviewData = {
	version: number;
	messagePreview: protoInbox.preview.MessagePreview;
};

export type MessagePreviewMigrationRule = MigrationRule<MessagePreviewData>;

export function getAllMessagePreviewMigrations(sdkConfig: Configuration) {
	const identityKeys = IdentityKeys.create(sdkConfig);

	return combineMigrations(createV2IdentityKey(identityKeys), createV3EncodeIdentityKey());
}

export function createV2IdentityKey(identityKeys: IdentityKeys): MessagePreviewMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 1),
		apply: async (data) => {
			const result = await identityKeys.getAddressIdentityKey(parseNameServiceAddress(data.messagePreview.owner));

			if (result == null)
				throw new Error(`no identity key found for [${data.messagePreview.owner}], failed message migration`);

			return {
				version: 2,
				messagePreview: protoInbox.preview.MessagePreview.create({
					...data.messagePreview,
					mailbox: result.identityKey.bytes,
				}),
			};
		},
	};
}

export function createV3EncodeIdentityKey(): MessagePreviewMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 2),
		apply: async (data) => {
			const { messagePreview } = data;
			const owner = parseNameServiceAddress(messagePreview.owner);
			let mailboxIdentityKey: PublicKey | null = null;
			if (messagePreview.mailbox.length === ED25519PublicKeyLen && isMailchainAccountAddress(owner)) {
				// ed25519 keys are only used for Mailchain accounts as of v2
				// should also check protocol
				mailboxIdentityKey = new ED25519PublicKey(messagePreview.mailbox);
			} else if (messagePreview.mailbox.length === SECP256K1PublicKeyLength) {
				mailboxIdentityKey = new SECP256K1PublicKey(messagePreview.mailbox);
			}

			if (mailboxIdentityKey == null)
				throw new Error(`failed message migration, failed mailbox identity key resolution`);

			return {
				version: 3,
				messagePreview: protoInbox.preview.MessagePreview.create({
					...messagePreview,
					mailbox: publicKeyToBytes(mailboxIdentityKey),
				}),
			};
		},
	};
}
