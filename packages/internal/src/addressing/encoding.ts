import { EncodingTypes, EncodingType } from '@mailchain/encoding';
import { Encode } from '@mailchain/encoding/encoding';
import { ALGORAND, ALL_PROTOCOLS, ETHEREUM, ProtocolType, SUBSTRATE } from '../protocols';

/**
 * EncodeAddressByProtocol takes an address as an Uint8Array then selects the relevant encoding method to encode it as string.
 * @param address
 * @param param1
 * @param byte
 * @param protocol
 * @param string
 */
export function EncodeAddressByProtocol(
	address: Uint8Array,
	protocol: ProtocolType,
): { encoded: string; encoding: string } {
	const encoding = EncodingByProtocol(protocol);
	const encoded = Encode(encoding, address);

	return { encoded, encoding };
}

/**
 * EncodingByProtocol returns the relevant encoding method the protocol commonly uses.
 */
//
export function EncodingByProtocol(protocol: ProtocolType): EncodingType {
	switch (protocol) {
		case ALGORAND:
			return EncodingTypes.Base32;
		case ETHEREUM:
			return EncodingTypes.Hex0xPrefix;
		case SUBSTRATE:
			return EncodingTypes.Base58;
		default:
			throw new Error(`unknown address encoding of [${protocol}]. Supported ${ALL_PROTOCOLS}.`);
	}
}
