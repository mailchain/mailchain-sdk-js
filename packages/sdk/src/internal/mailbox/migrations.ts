import { encodePublicKey } from '@mailchain/crypto';
import { ED25519PublicKey, ED25519PublicKeyLen } from '@mailchain/crypto/ed25519';
import { SECP256K1PublicKey, SECP256K1PublicKeyLength } from '@mailchain/crypto/secp256k1/public';
import { decodeHexZeroX } from '@mailchain/encoding';
import { AddressesApiFactory, AddressesApiInterface } from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { combineMigrations, MigrationRule } from '../migration';
import * as protoInbox from '../protobuf/inbox/inbox';
import { Configuration } from '../..';

type MessagePreviewData = {
	version: number;
	messagePreview: protoInbox.preview.MessagePreview;
};

export type MessagePreviewMigrationRule = MigrationRule<MessagePreviewData>;

export function getAllMessagePreviewMigrations(sdkConfig: Configuration) {
	const axiosConfig = createAxiosConfiguration(sdkConfig);

	const addressesApi = AddressesApiFactory(axiosConfig);
	return combineMigrations(
		createV1V2MessagePreviewMigration(addressesApi),
		createV2V3MessagePreviewMigration(sdkConfig.mailchainAddressDomain),
	);
}

function createV1V2MessagePreviewMigration(addressesApi: AddressesApiInterface): MessagePreviewMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 1),
		apply: async ({ messagePreview }) => {
			const mailbox = await addressesApi
				.getAddressIdentityKey(messagePreview.owner)
				.then(({ data }) => decodeHexZeroX(data.identityKey));

			return {
				version: 2,
				messagePreview: protoInbox.preview.MessagePreview.create({ ...messagePreview, mailbox }),
			};
		},
	};
}

function createV2V3MessagePreviewMigration(mailchainAddressDomain: string): MessagePreviewMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 2),
		apply: async ({ messagePreview }) => {
			if (
				messagePreview.mailbox.length === SECP256K1PublicKeyLength &&
				messagePreview.owner.indexOf(`@${mailchainAddressDomain}`) === -1
			) {
				messagePreview.mailbox = encodePublicKey(new SECP256K1PublicKey(messagePreview.mailbox));
			} else if (messagePreview.mailbox.length === ED25519PublicKeyLen) {
				// ed25519 keys are only used for Mailchain accounts as of v2
				// should also check protocol
				messagePreview.mailbox = encodePublicKey(new ED25519PublicKey(messagePreview.mailbox));
			}

			return {
				version: 3,
				messagePreview: protoInbox.preview.MessagePreview.create({ ...messagePreview }),
			};
		},
	};
}
