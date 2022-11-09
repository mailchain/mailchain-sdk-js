import { NameServiceAddress } from './nameServiceAddress';
import { ALL_PROTOCOLS, MAILCHAIN, ProtocolType } from './protocols';

export function parseWalletAddress(
	address: NameServiceAddress,
): { protocol: ProtocolType; network?: string } | undefined {
	const domainParts = address.domain.split('.');
	if (domainParts.length <= 2) return undefined;

	const protocol = ALL_PROTOCOLS.find((search) => domainParts.includes(search));
	if (protocol == null || protocol === MAILCHAIN) return undefined;

	const protocolIndex = domainParts.indexOf(protocol);
	const network = domainParts[protocolIndex - 1];

	return { protocol, network };
}
