import { EncodingTypes, EncodingType, decode, encode } from '@mailchain/encoding';
import { ALGORAND, ALL_PROTOCOLS, ETHEREUM, MAILCHAIN, ProtocolType, SUBSTRATE } from './protocols';

/**
 * Convert address from Uint8Array, selects the relevant encoding method and encodes it as string.
 */
export function encodeAddressByProtocol(
	address: Uint8Array,
	protocol: ProtocolType,
): { encoded: string; encoding: string } {
	const encoding = encodingByProtocol(protocol);
	const encoded = encode(encoding, address);

	return { encoded, encoding };
}

/**
 * Convert address from string, selects the relevant encoding method and decodes it as Uint8Array.
 */
export function decodeAddressByProtocol(
	address: string,
	protocol: ProtocolType,
): { decoded: Uint8Array; encoding: string } {
	const encoding = encodingByProtocol(protocol);
	const decoded = decode(encoding, address);

	return { decoded, encoding };
}

/**
 * EncodingByProtocol returns the relevant encoding method the protocol commonly uses.
 */
//
export function encodingByProtocol(protocol: ProtocolType): EncodingType {
	switch (protocol) {
		case ALGORAND:
			return EncodingTypes.Base32;
		case ETHEREUM:
			return EncodingTypes.Hex0xPrefix;
		case SUBSTRATE:
			return EncodingTypes.Base58;
		case MAILCHAIN:
			return EncodingTypes.Utf8;
		default:
			throw new Error(`unknown address encoding of [${protocol}]. Supported ${ALL_PROTOCOLS}.`);
	}
}
