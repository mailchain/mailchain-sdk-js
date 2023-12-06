import { MessagingKeys, ResolveIndividualAddressResult } from '@mailchain/internal/messagingKeys';
import { Configuration, defaultConfiguration } from '@mailchain/internal/configuration';

/**
 * Resolve the address and returns proven messaging key for an address.
 * @param address Address to resolve.
 *
 * @returns A {@link ResolvedAddress resolved address}.
 *
 * @example
 * import { resolveAddress } from '@mailchain/sdk';
 *
 * const {data: resolvedAddress, error} = await resolveAddress(address);
 * if (error != null) // handle error
 * else console.log(resolvedAddress);
 */
export async function resolveAddress(
	address: string,
	config: Configuration = defaultConfiguration,
): Promise<ResolveIndividualAddressResult> {
	return MessagingKeys.create(config).resolveIndividual(address);
}
