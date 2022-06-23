import { PublicKey, IdSECP256K1, IdED25519, IdSR25519, PrivateKey } from '..';
import { SECP256K1PublicKey, SECP256K1PrivateKey } from '../secp256k1';
import { ED25519PublicKey, ED25519PrivateKey } from '../ed25519';
import { SR25519PublicKey, SR25519PrivateKey } from '../sr25519';

export function IdFromPublicKey(key: PublicKey): number {
	switch (key.constructor) {
		case ED25519PublicKey:
			return IdED25519;
		case SECP256K1PublicKey:
			return IdSECP256K1;
		case SR25519PublicKey:
			return IdSR25519;
		default:
			throw RangeError('unknown public key type');
	}
}

export function IdFromPrivateKey(key: PrivateKey): number {
	switch (key.constructor) {
		case ED25519PrivateKey:
			return IdED25519;
		case SECP256K1PrivateKey:
			return IdSECP256K1;
		case SR25519PrivateKey:
			return IdSR25519;
		default:
			throw RangeError('unknown private key type');
	}
}

export function PublicKeyFromId(id: number, data: Uint8Array): PublicKey {
	switch (id) {
		case IdSECP256K1:
			return new SECP256K1PublicKey(data);
		case IdED25519:
			return new ED25519PublicKey(data);
		case IdSR25519:
			return new SR25519PublicKey(data);
		default:
			throw RangeError('unknown public key id');
	}
}

export function PrivateKeyFromId(id: number, data: Uint8Array): PrivateKey {
	switch (id) {
		case IdSECP256K1:
			return new SECP256K1PrivateKey(data);
		case IdED25519:
			return ED25519PrivateKey.fromSecretKey(data);
		case IdSR25519:
			return SR25519PrivateKey.fromBytes(data);
		default:
			throw RangeError('unknown private key id');
	}
}
