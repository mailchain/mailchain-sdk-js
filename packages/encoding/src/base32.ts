import { base32Decode, base32Encode, isBase32 as isBase32Internal } from '@polkadot/util-crypto/base32';

export function decodeBase32(input: string): Uint8Array {
	return base32Decode(input);
}

export function encodeBase32(input: Uint8Array): string {
	return base32Encode(input);
}

export function isBase32(input: string): boolean {
	return isBase32Internal(input);
}
