// EncodeHexZeroX encodes src into "0x"+hex.Encode. As a convenience, it returns the encoding type used,
// but this value is always TypeHex0XPrefix.
// EncodeHexZeroX uses hexadecimal encoding prefixed with "0x".
export function EncodeHexZeroX(input: Uint8Array): string {
	return '0x' + EncodeHex(input);
}

// DecodeHexZeroX returns the bytes represented by the hexadecimal string src.
export function DecodeHexZeroX(input: string): Uint8Array {
	if (input === '') {
		throw new RangeError('empty hex string');
	}

	if (!input.startsWith('0x')) {
		throw new RangeError("must start with '0x'");
	}

	return DecodeHex(input.slice(2));
}

// EncodeHex returns the hexadecimal encoding of src.
export function EncodeHex(input: Uint8Array): string {
	return Buffer.from(input).toString('hex');
}

// DecodeHex returns the bytes represented by the hexadecimal string s.
export function DecodeHex(input: string): Uint8Array {
	const output = new Uint8Array(Buffer.from(input, 'hex'));
	if (output.length === 0 || input.length === 0) {
		throw RangeError('invalid hex encoding');
	}
	return output;
}

export function isAnyHex(address: string): boolean {
	if (address.startsWith('0x')) {
		address = address.substring(2);
	}
	return new RegExp('^[a-fA-F0-9]+$').test(address);
}
