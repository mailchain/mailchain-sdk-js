import {
	BN,
	bnToU8a,
	compactAddLength,
	hexToU8a,
	isBigInt,
	isBn,
	isHex,
	isNumber,
	isString,
	stringToU8a,
} from '@polkadot/util';
import { BN_LE_256_OPTS } from '@polkadot/util-crypto/bn';
import { blake2AsU8a } from '@polkadot/util-crypto';
import { PrivateKey } from '.';

const CHAIN_CODE_LEN = 32;

export interface ExtendedPrivateKey {
	readonly Bytes: Uint8Array;
	readonly PrivateKey: PrivateKey;
}

export type HardenedDerivationFunction = (
	parentKey: ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array | BN,
) => Promise<ExtendedPrivateKey>;

export function ChainCodeFromDeriveIndex(value: string | number | bigint | Uint8Array | BN): Uint8Array {
	if (isNumber(value) || isBn(value) || isBigInt(value)) {
		return ChainCodeFromDeriveIndex(bnToU8a(value, BN_LE_256_OPTS));
	} else if (isHex(value)) {
		return ChainCodeFromDeriveIndex(hexToU8a(value));
	} else if (isString(value)) {
		return ChainCodeFromDeriveIndex(compactAddLength(stringToU8a(value)));
	} else if (value.length > CHAIN_CODE_LEN) {
		return ChainCodeFromDeriveIndex(blake2AsU8a(value));
	}

	const chainCode = new Uint8Array(32);
	chainCode.fill(0);
	chainCode.set(value, 0);

	return chainCode;
}
