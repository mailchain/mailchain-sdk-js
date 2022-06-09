import { base32Decode, base32Encode } from '@polkadot/util-crypto';

export function DecodeBase32(input: string): Uint8Array {
	return base32Decode(input);
}

export function EncodeBase32(input: Uint8Array): string {
	return base32Encode(input);
}
