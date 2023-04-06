import { decodeHexAny, encodeHex } from '@mailchain/encoding';
import {
	PrivateKey,
	PublicKey,
	privateKeyFromBytes,
	privateKeyToBytes,
	publicKeyFromBytes,
	publicKeyToBytes,
} from '@mailchain/crypto';

export function privateMessagingKeyFromHex(hex: string): PrivateKey {
	return privateKeyFromBytes(decodeHexAny(hex));
}

export function privateMessagingKeyToHex(key: PrivateKey): string {
	return encodeHex(privateKeyToBytes(key));
}

export function publicMessagingKeyFromHex(hex: string): PublicKey {
	return publicKeyFromBytes(decodeHexAny(hex));
}

export function publicMessagingKeyToHex(key: PublicKey): string {
	return encodeHex(publicKeyToBytes(key));
}
