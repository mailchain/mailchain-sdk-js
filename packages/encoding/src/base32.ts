import { base32Decode, base32Encode } from '@polkadot/util-crypto';

export function decodeBase32(input: string): Uint8Array {
	return base32Decode(input);
}

export function encodeBase32(input: Uint8Array): string {
	return base32Encode(input);
}
