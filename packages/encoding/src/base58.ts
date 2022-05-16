import { base58Decode, base58Encode } from '@polkadot/util-crypto';

export function DecodeBase58(input: string): Uint8Array {
	return base58Decode(input);
}

export function EncodeBase58(input: Uint8Array): string {
	return base58Encode(input);
}
