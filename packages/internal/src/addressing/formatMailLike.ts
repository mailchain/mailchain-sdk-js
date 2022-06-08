import { ProtocolType } from '../protocols';
import { EncodeAddressByProtocol } from './encoding';

/**
 * @param address the wallet address in raw non-encoded format
 */
export function formatMailLike(address: Uint8Array, protocol: ProtocolType, network?: string): string;
/**
 * @param encodedAddress the wallet address in encoded format corresponding to the provided protocol.
 */
export function formatMailLike(encodedAddress: string, protocol: ProtocolType, network?: string): string;

export function formatMailLike(
	maybeEncodedAddress: string | Uint8Array,
	protocol: ProtocolType,
	network?: string,
): string {
	const encodedAddress =
		typeof maybeEncodedAddress === 'string'
			? maybeEncodedAddress
			: EncodeAddressByProtocol(maybeEncodedAddress, protocol).encoded;
	if (network) {
		return `${encodedAddress}@${network}.${protocol}.mailchain`;
	}
	return `${encodedAddress}@${protocol}.mailchain`;
}
