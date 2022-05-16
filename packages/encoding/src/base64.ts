export function DecodeBase64(input: string): Uint8Array {
	const output = Buffer.from(input, 'base64');
	if (input.length > 0 && output.length === 0) {
		throw new Error('could not decode input');
	}

	return Uint8Array.from(output);
}

export function EncodeBase64(input: Uint8Array): string {
	return Buffer.from(input).toString('base64');
}

export function DecodeBase64UrlSafe(input: string): Uint8Array {
	let encoded = input.replace('-', '+').replace('_', '/');
	while (encoded.length % 4) encoded += '=';
	const output = Buffer.from(encoded, 'base64');
	if (input.length > 0 && output.length === 0) {
		throw new Error('could not decode input');
	}

	return Uint8Array.from(output);
}

export function EncodeBase64UrlSafe(input: Uint8Array): string {
	return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
