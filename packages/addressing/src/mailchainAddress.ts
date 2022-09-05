import { casingByProtocol } from './addressCasing';
import { ALGORAND, ETHEREUM, MAILCHAIN, ProtocolType, SUBSTRATE } from './protocols';

/**
 * Representation of the address used in Mailchain applications. For safety, should be created by {@link createMailchainAddress}.
 */
export type MailchainAddress = {
	value: string;
	protocol: ProtocolType;
	domain: string;
};

/**
 * Representation of the address used in Mailchain applications that is owned by the current user. For safety, should be created by {@link createOwnedMailchainAddress}.
 */
export type OwnedMailchainAddress = MailchainAddress & {
	nonce: number;
};

export function createMailchainAddress(value: string, protocol: ProtocolType, domain: string): MailchainAddress {
	protocol = protocol.toLowerCase() as ProtocolType;
	return {
		value: casingByProtocol(value, protocol),
		protocol,
		domain: domain.toLowerCase(),
	};
}

export function isSameMailchainAddress(a: MailchainAddress, b: MailchainAddress): boolean {
	return a.value === b.value && a.protocol === b.protocol && a.domain === b.domain;
}

export function createOwnedMailchainAddress(
	value: string,
	protocol: ProtocolType,
	domain: string,
	nonce: number,
): OwnedMailchainAddress {
	return { ...createMailchainAddress(value, protocol, domain), nonce };
}
