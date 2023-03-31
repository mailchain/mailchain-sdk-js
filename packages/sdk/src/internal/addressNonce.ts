import { ProtocolType } from '@mailchain/addressing';
import { defaultConfiguration } from '@mailchain/internal/configuration';
import { GetMessagingKeyLatestNonceResult, AddressNonce } from '@mailchain/internal/messagingKeys';
/**
 * Get the latest nonce for an address.
 *
 * @param address the protocol get the latest nonce for.
 * @param protocol where to find the address.
 * @returns The latest nonce for the given address.
 */
export async function getMessagingKeyLatestNonce(
	address: string,
	protocol: ProtocolType,
): Promise<GetMessagingKeyLatestNonceResult> {
	return AddressNonce.create(defaultConfiguration).getMessagingKeyLatestNonce(address, protocol);
}
