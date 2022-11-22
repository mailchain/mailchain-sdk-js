import { NameServiceAddress } from '../nameServiceAddress';
import { NameserviceDescription } from './nameserviceDescriptions';

export function matchesNameservice(
	address: NameServiceAddress,
	nameserviceDescription: NameserviceDescription,
): string | undefined {
	if (!address.domain.startsWith(nameserviceDescription.name)) return undefined;

	return nameserviceDescription.domains.find((domain) => address.username.endsWith(domain));
}
