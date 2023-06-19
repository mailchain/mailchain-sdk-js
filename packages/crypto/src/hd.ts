import { blake2b } from '@noble/hashes/blake2b';
import { decodeHexZeroX, decodeUtf8, isHexZeroX } from '@mailchain/encoding';
import BN from 'bn.js';
import { PrivateKey } from '.';
const CHAIN_CODE_LEN = 32;

export interface ExtendedPrivateKey {
	readonly bytes: Uint8Array;
	readonly privateKey: PrivateKey;
}

export type HardenedDerivationFunction = (
	parentKey: ExtendedPrivateKey,
	index: string | number | Uint8Array | BN,
) => Promise<ExtendedPrivateKey>;

export function chainCodeFromDeriveIndex(value: string | number | Uint8Array | BN): Uint8Array {
	if (isNumber(value) || BN.isBN(value)) {
		return chainCodeFromDeriveIndex(Uint8Array.from(new BN(value).toArray('le', 256 / 8)));
	} else if (isString(value) && isHexZeroX(value)) {
		return chainCodeFromDeriveIndex(decodeHexZeroX(value));
	} else if (isString(value)) {
		return chainCodeFromDeriveIndex(Uint8Array.from([...compactToU8a(value.length), ...decodeUtf8(value)]));
	} else if (value.length > CHAIN_CODE_LEN) {
		return chainCodeFromDeriveIndex(blake2b(value, { dkLen: 256 / 8 }));
	}

	const chainCode = new Uint8Array(32);
	chainCode.fill(0);
	chainCode.set(value, 0);

	return chainCode;
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

function isString(value: unknown): value is string {
	return typeof value === 'string' || value instanceof String;
}

const BN_ONE = new BN(1);
const BN_TWO = new BN(2);
const MAX_U8 = BN_TWO.pow(new BN(8 - 2)).isub(BN_ONE);
const MAX_U16 = BN_TWO.pow(new BN(16 - 2)).isub(BN_ONE);

function compactToU8a(value: number) {
	const bn = new BN(value);

	if (bn.lte(MAX_U8)) {
		return new Uint8Array([bn.toNumber() << 2]);
	} else if (bn.lte(MAX_U16)) {
		return bn
			.shln(2)
			.iadd(BN_ONE)
			.toArray('le', 16 / 8);
	}
	return bn
		.shln(2)
		.iadd(BN_TWO)
		.toArray('le', 32 / 8);
}
