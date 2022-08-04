import { decodeHex, decodeHexZeroX } from '@mailchain/encoding';

export function toUint8Array(value: Uint8Array | string | Buffer): Uint8Array {
	if (typeof value === 'string') {
		value = value.trim();
		return value.startsWith('0x') ? decodeHexZeroX(value) : decodeHex(value);
	}

	return value;
}
