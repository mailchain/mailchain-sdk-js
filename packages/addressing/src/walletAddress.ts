import { casingByProtocol } from './addressCasing';
import { createNameServiceAddress, NameServiceAddress as MailchainAddress } from './nameServiceAddress';
import { MAILCHAIN, ProtocolType } from './protocols';

/**
 * Helper method for creating of {@link MailchainAddress} for when the address is with specific protocol.
 * It provides the correct casing for the username.
 */
export function createWalletAddress(
	username: string,
	protocol: ProtocolType,
	mailchainAddressDomain: string,
): MailchainAddress {
	protocol = protocol.toLowerCase() as ProtocolType;
	const casedUsername = casingByProtocol(username, protocol);
	if (protocol === MAILCHAIN) return createNameServiceAddress(casedUsername, mailchainAddressDomain);
	return createNameServiceAddress(casedUsername, protocol, mailchainAddressDomain);
}
