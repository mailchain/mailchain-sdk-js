import { createWalletAddress, encodeAddressByProtocol, formatAddress, ProtocolType } from '@mailchain/addressing';
import { encodePublicKey } from '@mailchain/crypto';
import { IdentityKeys } from '../identityKeys';
import { MigrationRule } from '../migration';
import { user } from '../protobuf/user/user';

type UserMailboxData = {
	version: number;
	protoMailbox: user.Mailbox;
};

export type UserMailboxMigrationRule = MigrationRule<UserMailboxData>;

export function createV2IdentityKey(
	identityKeys: IdentityKeys,
	mailchainAddressDomain: string,
): UserMailboxMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 1),
		apply: async ({ protoMailbox }) => {
			const protocol = protoMailbox.protocol as ProtocolType;
			const encodedAddress = encodeAddressByProtocol(protoMailbox.address!, protocol).encoded;
			const result = await identityKeys.getAddressIdentityKey(
				createWalletAddress(encodedAddress, protocol, mailchainAddressDomain),
			);

			// Note: Theoretically not possible not to find identity key for registered address, but lets handle it
			if (result == null) throw new Error(`no identity key fround for address [${encodedAddress}]`);

			return {
				version: 2,
				protoMailbox: user.Mailbox.create({
					...protoMailbox,
					identityKey: encodePublicKey(result.identityKey),
				}),
			};
		},
	};
}

export function createV3LabelMigration(mailchainAddressDomain: string): UserMailboxMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 2),
		apply: (data) =>
			Promise.resolve({
				version: 3,
				protoMailbox: user.Mailbox.create({
					...data.protoMailbox,
					label: null,
				}),
			}),
	};
}

export function createV4AliasesMigration(mailchainAddressDomain: string): UserMailboxMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 3),
		apply: (data) => {
			const { protoMailbox } = data;
			const protocol = protoMailbox.protocol as ProtocolType;
			const encodedAddress = encodeAddressByProtocol(protoMailbox.address!, protocol).encoded;
			const address = formatAddress(
				createWalletAddress(encodedAddress, protocol, mailchainAddressDomain),
				'mail',
			);

			return Promise.resolve({
				version: 4,
				protoMailbox: user.Mailbox.create({
					...protoMailbox,
					aliases: [{ address, blockSending: false, blockReceiving: false }],
				}),
			});
		},
	};
}
