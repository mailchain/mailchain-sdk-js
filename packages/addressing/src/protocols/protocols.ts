import { isAnyHex } from '@mailchain/encoding';
import { ETHEREUM, MAILCHAIN, ProtocolType } from './consts';

/**
 * Tries to guess what protocols this address could be. It will check for length, characters, and prefixes (where relevant).
 * @param address
 * @returns List of possible protocols. There are no guarantees the address exists on any of the returned protocols.
 */
export function guessProtocolsFromAddress(address: string): ProtocolType[] {
	address = address.trim();
	const isAddressHex = isAnyHex(address);

	const protocols = new Set<ProtocolType>();
	// needs to be a series of if statements as can be multiple protocols
	if (isAddressHex && address.length === 42 && address.startsWith('0x')) {
		protocols.add(ETHEREUM);
	}
	if (address.length <= 20 && address.length >= 3 && new RegExp('^[a-zA-Z0-9_-]+$').test(address)) {
		protocols.add(MAILCHAIN);
	}

	return Array.from(protocols);
}
