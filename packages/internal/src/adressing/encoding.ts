import { EncodingTypes, EncodingType } from '@mailchain/encoding';
import { Encode } from '@mailchain/encoding/encoding';
import { Algorand, Ethereum, Substrate } from '../protocols';

/**
 * EncodeAddressByProtocol takes an address as an Uint8Array then selects the relevant encoding method to encode it as string.
 * @param address
 * @param param1
 * @param byte
 * @param protocol
 * @param string
 */
export function EncodeAddressByProtocol(address: Uint8Array, protocol: string): { encoded: string; encoding: string } {
	const encoding = EncodingByProtocol(protocol);
	const encoded = Encode(encoding, address);

	return { encoded, encoding };
}

/**
 * EncodingByProtocol returns the relevant encoding method the protocol commonly uses.
 */
//
export function EncodingByProtocol(protocol: string): EncodingType {
	switch (protocol) {
		case Algorand:
			return EncodingTypes.Base32;
		case Ethereum:
			return EncodingTypes.Hex0xPrefix;
		case Substrate:
			return EncodingTypes.Base58;
		default:
			throw new Error('unknown address encoding');
	}
}
