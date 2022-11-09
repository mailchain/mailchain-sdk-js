import { EncodingType } from './consts';
import { decode } from './encoding';

export function ensureDecoded(value: Uint8Array | string | Buffer, encoding: EncodingType) {
	if (typeof value === 'string') {
		return decode(encoding, value);
	}

	return value;
}
