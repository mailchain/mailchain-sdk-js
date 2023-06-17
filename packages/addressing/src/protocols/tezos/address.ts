import { KindED25519, KindSECP256K1, KindSECP256R1, PublicKey } from '@mailchain/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { blake2b } from '@noble/hashes/blake2b';
import { decodeBase58, isBase58 } from '@mailchain/encoding';
import { Prefix, prefix } from './const';

/**
 * Derive the tezos address corresponding to the {@link PublicKey}.
 *
 * @param publicKey must be either a key of {@link KindSECP256K1} or {@link KindED25519} or {@link KindSECP256R1}.
 * @throw if the provided key is on unsupported curve
 */
export function tezosAddressFromPublicKey(publicKey: PublicKey): Uint8Array {
	let prefixArray: Uint8Array;
	switch (publicKey.curve) {
		case KindSECP256K1:
			prefixArray = prefix.tz2;
			break;
		case KindED25519:
			prefixArray = prefix.tz1;
			break;
		case KindSECP256R1:
			prefixArray = prefix.tz3;
			break;
		default:
			throw new Error(`public key curve not supported`);
	}

	return composeAddress(publicKey.bytes, prefixArray);
}

function checksum(input: Uint8Array) {
	const h = sha256(input);
	const h2 = sha256(h);
	return h2.slice(0, 4);
}

function hash(pkBytes: Uint8Array) {
	return blake2b(pkBytes, { dkLen: 160 / 8 });
}

function composeAddress(key: Uint8Array, prefixArray: Uint8Array) {
	const h = hash(key);
	const result: Uint8Array = new Uint8Array(27);
	result.set(prefixArray, 0);
	result.set(h, 3);
	result.set(checksum(result.slice(0, 23)), 23);
	return result;
}

export function validateTezosAddress(address: string): boolean {
	if (address.length !== 36) {
		return false;
	} else if (
		address.slice(0, 3) !== Prefix.TZ1 &&
		address.slice(0, 3) !== Prefix.TZ2 &&
		address.slice(0, 3) !== Prefix.TZ3
	) {
		return false;
	} else if (!isBase58(address)) {
		return false;
	}

	const decoded = decodeBase58(address);

	const addressChecksum = checksum(decoded.slice(0, 23));
	if (decoded.slice(-4).toString() !== addressChecksum.toString()) {
		return false;
	}

	return true;
}
