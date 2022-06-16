import { ProtocolType } from '../protocols';
import { encodeAddressByProtocol } from './encoding';

/**
 * @param address the wallet address in raw non-encoded format
 */
export function formatMailLike(address: Uint8Array, protocol: ProtocolType, mailchainDomain: string): string;
/**
 * @param encodedAddress the wallet address in encoded format corresponding to the provided protocol.
 */
export function formatMailLike(encodedAddress: string, protocol: ProtocolType, mailchainDomain: string): string;

export function formatMailLike(
	maybeEncodedAddress: string | Uint8Array,
	protocol: ProtocolType,
	mailchainDomain: string,
): string {
	const encodedAddress =
		typeof maybeEncodedAddress === 'string'
			? maybeEncodedAddress
			: encodeAddressByProtocol(maybeEncodedAddress, protocol).encoded;
	return `${encodedAddress}@${protocol}.${mailchainDomain}`;
}
