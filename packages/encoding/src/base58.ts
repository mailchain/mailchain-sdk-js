import { base58 } from '@scure/base';
export function decodeBase58(input: string): Uint8Array {
	return base58.decode(input);
}

export function encodeBase58(input: Uint8Array): string {
	return base58.encode(input);
}

export function isBase58(input: string): boolean {
	return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(input);
}
