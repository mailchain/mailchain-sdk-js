import {
	createNameServiceAddress,
	createWalletAddress,
	encodeAddressByProtocol,
	formatAddress,
	ProtocolType,
} from '@mailchain/addressing';
import { decodePublicKey, encodePublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import { IdentityKeys } from '../identityKeys';
import { MigrationRule } from '../migration';
import { Nameservices } from '../nameservices';
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

export function createV5NsMigration(
	nameservices: Nameservices,
	mailchainAddressDomain: string,
): UserMailboxMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 4),
		apply: async ({ protoMailbox }) => {
			const identityKey = decodePublicKey(protoMailbox.identityKey);
			try {
				const foundNames = await nameservices.reverseResolveNames(identityKey);

				const aliases = [...protoMailbox.aliases];
				for (const { name } of foundNames) {
					const address = createNameServiceAddress(name, mailchainAddressDomain);
					const aliasAddress = formatAddress(address, 'mail');
					if (aliases.some((alias) => alias.address === aliasAddress)) continue;

					const alias = user.Mailbox.Alias.create({
						address: aliasAddress,
						blockSending: false,
						blockReceiving: false,
					});
					aliases.push(alias);
				}

				return { version: 5, protoMailbox: user.Mailbox.create({ ...protoMailbox, aliases }) };
			} catch (e) {
				console.warn(
					`failed reverse search for identity key ${encodeHexZeroX(
						protoMailbox.identityKey,
					)}. Will bump version without storing NS aliases`,
				);
				return { version: 5, protoMailbox };
			}
		},
	};
}
