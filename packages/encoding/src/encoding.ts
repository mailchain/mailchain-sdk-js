import { DecodeBase58, EncodeBase58 } from './base58';
import { BASE58, Encodings, HEX, HEX_0X_PREFIX } from './consts';
import { DecodeHex, DecodeHexZeroX, EncodeHex, EncodeHexZeroX } from './hex';

const errUnsupportedEncoding = new Error('encoding not supported');

/**
 * Decode returns the bytes represented by the decoded string src.
 * Decode uses the decode method mapped to kind parameter.
 *
 * If the input is kind is unknown or the input is malformed for the decode method it returns an error.
 * @param encoding
 * @param src
 * @returns
 */
export function Decode(encoding: Encodings, src: string): Uint8Array {
	switch (encoding.toLowerCase()) {
		case BASE58:
			return DecodeBase58(src);
		case HEX:
			return DecodeHex(src);
		case HEX_0X_PREFIX:
			return DecodeHexZeroX(src);
		default:
			throw errUnsupportedEncoding;
	}
}

/**
 * Encode returns the bytes encoded as requested by the encoding parameter.
 * @param encoding
 * @param src
 * @returns encoded value
 */
export function Encode(encoding: Encodings, src: Uint8Array): string {
	switch (encoding.toLowerCase()) {
		case BASE58:
			return EncodeBase58(src);
		case HEX:
			return EncodeHex(src);
		case HEX_0X_PREFIX:
			return EncodeHexZeroX(src);
		default:
			throw errUnsupportedEncoding;
	}
}
