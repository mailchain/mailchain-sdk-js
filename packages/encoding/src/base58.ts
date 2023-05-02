import { base58Decode, base58Encode } from '@polkadot/util-crypto/base58';

export function decodeBase58(input: string): Uint8Array {
	return base58Decode(input);
}

export function encodeBase58(input: Uint8Array): string {
	return base58Encode(input);
}
