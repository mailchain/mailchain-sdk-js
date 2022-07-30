import { decodeBase32, encodeBase32 } from './base32';
import { decodeBase58, encodeBase58 } from './base58';
import { encodeBase64UrlSafe } from './base64';
import { EncodingTypes, EncodingType } from './consts';
import { decodeHex, decodeHexZeroX, encodeHex, encodeHexZeroX } from './hex';
import { decodeUtf8, encodeUtf8 } from './utf8';

class UnsupportedEncodingError extends Error {
	constructor(encoding: string) {
		super(`Encoding [${encoding}] not supported`);
	}
}

/**
 * Decode returns the bytes represented by the decoded string src.
 * Decode uses the decode method mapped to kind parameter.
 *
 * If the input is kind is unknown or the input is malformed for the decode method it returns an error.
 * @param encoding
 * @param src
 * @returns
 */
export function decode(encoding: EncodingType, src: string): Uint8Array {
	switch (encoding.toLowerCase()) {
		case EncodingTypes.Base58:
			return decodeBase58(src);
		case EncodingTypes.Hex:
			return decodeHex(src);
		case EncodingTypes.Hex0xPrefix:
			return decodeHexZeroX(src);
		case EncodingTypes.Utf8:
			return decodeUtf8(src);
		case EncodingTypes.Base32:
			return decodeBase32(src);
		default:
			throw new UnsupportedEncodingError(encoding);
	}
}

/**
 * Encode returns the bytes encoded as requested by the encoding parameter.
 * @param encoding
 * @param src
 * @returns encoded value
 */
export function encode(encoding: EncodingType, src: Uint8Array): string {
	switch (encoding.toLowerCase()) {
		case EncodingTypes.Base58:
			return encodeBase58(src);
		case EncodingTypes.Hex:
			return encodeHex(src);
		case EncodingTypes.Hex0xPrefix:
			return encodeHexZeroX(src);
		case EncodingTypes.Base64:
			return encodeBase64UrlSafe(src);
		case EncodingTypes.Utf8:
			return encodeUtf8(src);
		case EncodingTypes.Base32:
			return encodeBase32(src);
		default:
			throw new UnsupportedEncodingError(encoding);
	}
}
