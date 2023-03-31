import {
	decodeAddressByProtocol,
	formatAddress,
	MailchainAddress,
	ProtocolType,
	addressFromPublicKey,
} from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';
import isEqual from 'lodash/isEqual';
import { IdentityKeys } from '../identityKeys';
import { ParseMimeTextResult } from '../formatters/parse';

type Resolved = { identityKey: PublicKey; protocol: ProtocolType };

/** Resolve the `IdentityKey` for the provided `address`. Returns `null` if no key was found for the provided address. */
export type AddressIdentityKeyResolver = (address: MailchainAddress) => Promise<Resolved | null>;

/** Create {@link AddressIdentityKeyResolver} that resolved identity keys by using the Mailchain API.  */
export function createMailchainApiAddressIdentityKeyResolver(identityKeys: IdentityKeys): AddressIdentityKeyResolver {
	return (address) => identityKeys.getAddressIdentityKey(address);
}

/** Create {@link AddressIdentityKeyResolver} that resolves by using mappings of address->IdentityKey that is part of {@link ParseMimeTextResult} with the `X-IdentityKeys` header.  */
export function createMessageHeaderIdentityKeyResolver(
	addressIdentityKeys: ParseMimeTextResult['addressIdentityKeys'],
): AddressIdentityKeyResolver {
	return async (address) => {
		const entry = addressIdentityKeys.get(formatAddress(address, 'mail'));
		if (entry == null) return null;

		try {
			const actualAddressBytes = decodeAddressByProtocol(address.username, entry.protocol).decoded;
			const expectedAddressBytes = await addressFromPublicKey(entry.identityKey, entry.protocol);
			if (isEqual(expectedAddressBytes, actualAddressBytes)) return entry;
		} catch (e) {
			// failed processing address, ignore it and don't return the key
		}
		return null;
	};
}
