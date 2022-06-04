export function EncodeUtf8(input: Uint8Array): string {
	return Buffer.from(input).toString('utf-8');
}

export function DecodeUtf8(input: string): Uint8Array {
	return new Uint8Array(Buffer.from(input, 'utf-8'));
}
