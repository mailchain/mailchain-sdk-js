export function encodeAscii(input: Uint8Array): string {
	return Buffer.from(input).toString('ascii');
}

export function decodeAscii(input: string): Uint8Array {
	if (!isAscii(input)) throw new Error('Input is not ASCII');
	return new Uint8Array(Buffer.from(input, 'ascii'));
}

export function isAscii(str: string) {
	// eslint-disable-next-line no-control-regex
	return /^[\x00-\x7F]+$/.test(str);
}
