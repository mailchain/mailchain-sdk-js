import { createWalletAddress, encodeAddressByProtocol, formatAddress, ProtocolType } from '@mailchain/addressing';
import { decodeHexZeroX } from '@mailchain/encoding';
import { AddressesApiInterface } from '../api';
import { MigrationRule } from '../migration';
import { user } from '../protobuf/user/user';

type UserMailboxData = {
	version: number;
	protoMailbox: user.Mailbox;
};

export type UserMailboxMigrationRule = MigrationRule<UserMailboxData>;

export function createV1V2IdentityKeyMigration(
	addressesApi: AddressesApiInterface,
	mailchainAddressDomain: string,
): UserMailboxMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 1),
		apply: async ({ protoMailbox }) => {
			const protocol = protoMailbox.protocol as ProtocolType;
			const encodedAddress = encodeAddressByProtocol(protoMailbox.address!, protocol).encoded;
			const identityKey = await addressesApi
				.getAddressIdentityKey(
					formatAddress(createWalletAddress(encodedAddress, protocol, mailchainAddressDomain), 'mail'),
				)
				.then(({ data }) => decodeHexZeroX(data.identityKey));

			return { version: 2, protoMailbox: user.Mailbox.create({ ...protoMailbox, identityKey }) };
		},
	};
}
