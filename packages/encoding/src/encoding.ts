import { DecodeBase32, EncodeBase32 } from './base32';
import { DecodeBase58, EncodeBase58 } from './base58';
import { EncodeBase64UrlSafe } from './base64';
import { EncodingTypes, EncodingType } from './consts';
import { DecodeHex, DecodeHexZeroX, EncodeHex, EncodeHexZeroX } from './hex';
import { DecodeUtf8, EncodeUtf8 } from './utf8';

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
export function Decode(encoding: EncodingType, src: string): Uint8Array {
	switch (encoding.toLowerCase()) {
		case EncodingTypes.Base58:
			return DecodeBase58(src);
		case EncodingTypes.Hex:
			return DecodeHex(src);
		case EncodingTypes.Hex0xPrefix:
			return DecodeHexZeroX(src);
		case EncodingTypes.Utf8:
			return DecodeUtf8(src);
		case EncodingTypes.Base32:
			return DecodeBase32(src);
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
export function Encode(encoding: EncodingType, src: Uint8Array): string {
	switch (encoding.toLowerCase()) {
		case EncodingTypes.Base58:
			return EncodeBase58(src);
		case EncodingTypes.Hex:
			return EncodeHex(src);
		case EncodingTypes.Hex0xPrefix:
			return EncodeHexZeroX(src);
		case EncodingTypes.Base64:
			return EncodeBase64UrlSafe(src);
		case EncodingTypes.Utf8:
			return EncodeUtf8(src);
		case EncodingTypes.Base32:
			return EncodeBase32(src);
		default:
			throw new UnsupportedEncodingError(encoding);
	}
}
