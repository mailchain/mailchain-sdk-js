import { decodeUtf8 } from '@mailchain/encoding';
import { decodeBase32, encodeBase32 } from '@mailchain/encoding/base32';
import { blake2b } from '@noble/hashes/blake2b';
import isEqual from 'lodash/isEqual.js';
import { PublicKey } from '@mailchain/crypto';
import { addressFromPublicKey as ethereumAddressFromPublicKey } from '../ethereum/address';
import { FilecoinAddressType } from './types';

const MIN_FIL_ADDRESS_STR_LENGTH = 6;
const MAX_FIL_ADDRESS_STR_LENGTH = 115;

export const MAINNET_PREFIX = 'f';
export const CALIBRATION_PREFIX = 't';

const ETHEREUM_NAMESPACE = 10;
const ETHEREUM_ADDRESS_LENGTH = 20;

const CHECKSUM_LENGTH = 4 as const;

export function convertFilDelegatedAddressToEthAddress(fileCoinAddress: string):
	| {
			data: Uint8Array;
			error?: undefined;
	  }
	| {
			error: Error;
			data?: undefined;
	  } {
	const filAddress = fileCoinAddress.toLowerCase();
	//check prefix and length of initial address
	if (!(filAddress.startsWith(MAINNET_PREFIX) || filAddress.startsWith(CALIBRATION_PREFIX))) {
		return {
			error: new Error(
				`invalid Filecoin address, should start with '${MAINNET_PREFIX}' or '${CALIBRATION_PREFIX}'`,
			),
		};
	}
	if (filAddress.length < MIN_FIL_ADDRESS_STR_LENGTH || filAddress.length > MAX_FIL_ADDRESS_STR_LENGTH) {
		return { error: new Error('invalid address length') };
	}

	//split address in namespace and sub address
	const raw = filAddress.slice(2);
	const namespaceStr = raw.slice(0, raw.indexOf('f'));
	const encodedSubAddress = raw.slice(raw.indexOf('f') + 1);

	//check namespace
	const namespace = parseInt(namespaceStr, 10);
	if (namespace !== ETHEREUM_NAMESPACE) {
		return {
			error: new Error(`invalid namespace, supported only Ethereum Address Manager {${ETHEREUM_NAMESPACE}}`),
		};
	}

	//decode base 32 the address + checksum
	const subAddress = decodeBase32(encodedSubAddress);
	if (subAddress.length < ETHEREUM_ADDRESS_LENGTH + CHECKSUM_LENGTH) {
		return { error: new Error('invalid subAddress length') };
	}

	//separate address and checksum
	const ethAddress = subAddress.slice(0, ETHEREUM_ADDRESS_LENGTH);
	const checksum = subAddress.slice(ETHEREUM_ADDRESS_LENGTH);
	if (ethAddress.length !== ETHEREUM_ADDRESS_LENGTH) {
		return { error: new Error('invalid Ethereum address length') };
	}

	//get checksum payload and validate it
	if (!validateChecksum(FilecoinAddressType.DELEGATED, namespace, ethAddress, checksum)) {
		return { error: new Error('invalid address checksum') };
	}

	return { data: ethAddress };
}

/**
 * Compute the Filecoin F4 Ethereum delegated address from the provided PublicKey.
 */
export async function filDelegatedAddressFromPublicKey(publicKey: PublicKey): Promise<Uint8Array> {
	const ethAddress = await ethereumAddressFromPublicKey(publicKey);
	return convertEthAddressToFilDelegated(ethAddress, MAINNET_PREFIX);
}

export function convertEthAddressToFilDelegated(
	ethereumAddress: Uint8Array,
	prefix: typeof MAINNET_PREFIX | typeof CALIBRATION_PREFIX = MAINNET_PREFIX,
): Uint8Array {
	if (ethereumAddress.length != ETHEREUM_ADDRESS_LENGTH) {
		throw new Error('invalid Ethereum address length');
	}

	const checksum = computeAddressChecksum(FilecoinAddressType.DELEGATED, ETHEREUM_NAMESPACE, ethereumAddress);
	const subAddress = new Uint8Array(ethereumAddress.length + checksum.length);
	subAddress.set(ethereumAddress, 0);
	subAddress.set(checksum, ethereumAddress.length);

	const encodedSubAddr = encodeBase32(subAddress);
	const filAddress = `${prefix}${FilecoinAddressType.DELEGATED}${ETHEREUM_NAMESPACE}f${encodedSubAddr}`;
	return decodeUtf8(filAddress);
}

function validateChecksum(
	addressType: FilecoinAddressType,
	namespace: number,
	address: Uint8Array,
	checksum: Uint8Array,
): boolean {
	const digest = computeAddressChecksum(addressType, namespace, address);
	return isEqual(digest, checksum);
}

function computeAddressChecksum(addressType: FilecoinAddressType, namespace: number, address: Uint8Array): Uint8Array {
	const namespaceBytes = numberToUInt8Array(namespace);

	const payload = new Uint8Array(1 + namespaceBytes.length + address.length);
	payload.set(new Uint8Array([addressType]), 0);
	payload.set(namespaceBytes, 1);
	payload.set(address, 1 + namespaceBytes.length);

	return blake2b(payload, { dkLen: CHECKSUM_LENGTH });
}

/** Convert potentially large number to a byte array */
function numberToUInt8Array(num: number): Uint8Array {
	if (num === 0) return new Uint8Array([0]);
	const res: number[] = [];
	res.unshift(num & 255);
	while (num >= 256) {
		num = num >>> 8;
		res.unshift(num & 255);
	}
	return new Uint8Array(res);
}
