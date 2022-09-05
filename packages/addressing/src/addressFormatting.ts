import { ETHEREUM, MAILCHAIN, ProtocolType } from './protocols';
import { MailchainAddress } from '.';

export function formatAddress(address: MailchainAddress, format: 'mail' | 'human-friendly'): string {
	switch (format) {
		case 'mail':
			return formatMailLike(address.value, address.protocol, address.domain);
		case 'human-friendly':
			return formatHumanFriendly(address);
		default:
			throw new Error(`Unsupported address format of [${format}]`);
	}
}

/**
 * @param encodedAddress the wallet address in raw non-encoded format
 */
export function formatMailLike(encodedAddress: string, protocol: ProtocolType, mailchainDomain: string): string {
	if (protocol === MAILCHAIN) {
		return `${encodedAddress}@${mailchainDomain}`;
	}
	return `${encodedAddress}@${protocol}.${mailchainDomain}`;
}

function formatHumanFriendly(address: MailchainAddress): string {
	if (address.protocol === MAILCHAIN) {
		return `${address.value}@${MAILCHAIN}`;
	} else if (address.protocol === ETHEREUM) {
		return `${address.value.slice(0, 6)}...${address.value.slice(-4)}@${ETHEREUM}`;
	}
	return `${address.value.slice(0, 4)}...${address.value.slice(-4)}@${address.protocol}`;
}
