import { BASE32, BASE58, Encodings, HEX_0X_PREFIX } from '@mailchain/encoding/consts';
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
export function EncodingByProtocol(protocol: string): Encodings {
	switch (protocol) {
		case Algorand:
			return BASE32;
		case Ethereum:
			return HEX_0X_PREFIX;
		case Substrate:
			return BASE58;
		default:
			throw new Error('unknown address encoding');
	}
}
