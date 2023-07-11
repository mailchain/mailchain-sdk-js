import { decodeHexAny, encodeHex } from '@mailchain/encoding';
import {
	PrivateKey,
	PublicKey,
	privateKeyFromBytes,
	privateKeyToBytes,
	publicKeyFromBytes,
	publicKeyToBytes,
} from '@mailchain/crypto';

/**
 * Converts a private messaging key from its hexadecimal representation to a {@link PrivateKey} object.
 * @param hex - The hexadecimal representation of the private messaging key.
 * @returns The {@link PrivateKey} object.
 */
export function privateMessagingKeyFromHex(hex: string): PrivateKey {
	return privateKeyFromBytes(decodeHexAny(hex));
}

/**
 * Converts a private messaging key from a {@link PrivateKey} object to its hexadecimal representation.
 * @param key - The {@link PrivateKey} object.
 * @returns The hexadecimal representation of the private messaging key.
 */
export function privateMessagingKeyToHex(key: PrivateKey): string {
	return encodeHex(privateKeyToBytes(key));
}

/**
 * Converts a public messaging key from its hexadecimal representation to a {@link PublicKey} object.
 * @param hex - The hexadecimal representation of the public messaging key.
 * @returns The {@link PublicKey} object.
 */
export function publicMessagingKeyFromHex(hex: string): PublicKey {
	return publicKeyFromBytes(decodeHexAny(hex));
}

/**
 * Converts a public messaging key from a {@link PublicKey} object to its hexadecimal representation.
 * @param key - The {@link PublicKey} object.
 * @returns The hexadecimal representation of the public messaging key.
 */
export function publicMessagingKeyToHex(key: PublicKey): string {
	return encodeHex(publicKeyToBytes(key));
}
