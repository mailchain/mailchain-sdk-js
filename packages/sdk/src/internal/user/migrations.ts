import { createMailchainAddress, encodeAddressByProtocol, formatAddress, ProtocolType } from '@mailchain/addressing';
import { decodeHexZeroX } from '@mailchain/encoding';
import { AddressesApiInterface } from '../api';
import { MigrationRule } from '../migration';
import { user } from '../protobuf/user/user';

type UserAddressData = {
	version: number;
	protoAddress: user.Address;
};

export type UserAddressMigrationRule = MigrationRule<UserAddressData>;

export function createV1V2IdentityKeyMigration(
	addressesApi: AddressesApiInterface,
	mailchainAddressDomain: string,
): UserAddressMigrationRule {
	return {
		shouldApply: (data) => Promise.resolve(data.version === 1),
		apply: async ({ protoAddress }) => {
			const protocol = protoAddress.protocol as ProtocolType;
			const encodedAddress = encodeAddressByProtocol(protoAddress.address!, protocol).encoded;
			const identityKey = await addressesApi
				.getAddressIdentityKey(
					formatAddress(createMailchainAddress(encodedAddress, protocol, mailchainAddressDomain), 'mail'),
				)
				.then(({ data }) => decodeHexZeroX(data.identityKey));

			return { version: 2, protoAddress: user.Address.create({ ...protoAddress, identityKey }) };
		},
	};
}
