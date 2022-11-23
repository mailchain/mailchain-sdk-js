import { NameServiceAddress } from '../nameServiceAddress';
import { NameserviceDescription } from './nameserviceDescriptions';

export function matchesNameservice(
	address: NameServiceAddress,
	nameserviceDescription: NameserviceDescription,
): string | undefined {
	const domainParts = address.domain.split('.');
	if (domainParts[0] !== nameserviceDescription.name) return undefined;

	const usernameParts = address.username.split('.');
	return nameserviceDescription.domains.find((domain) => usernameParts[usernameParts.length - 1] === domain);
}
