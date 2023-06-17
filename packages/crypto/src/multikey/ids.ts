import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { IdSECP256K1, IdED25519, IdSECP256R1 } from '../keys';
import { SECP256K1PrivateKey } from '../secp256k1/private';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { ED25519PrivateKey } from '../ed25519/private';
import { ED25519PublicKey } from '../ed25519/public';
import { SECP256R1PrivateKey, SECP256R1PublicKey } from '../secp256r1';

export function idFromPublicKey(key: PublicKey): number {
	switch (key.constructor) {
		case ED25519PublicKey:
			return IdED25519;
		case SECP256K1PublicKey:
			return IdSECP256K1;
		case SECP256R1PublicKey:
			return IdSECP256R1;
		default:
			throw RangeError('unknown public key type');
	}
}

export function idFromPrivateKey(key: PrivateKey): number {
	switch (key.constructor) {
		case ED25519PrivateKey:
			return IdED25519;
		case SECP256K1PrivateKey:
			return IdSECP256K1;
		case SECP256R1PrivateKey:
			return IdSECP256R1;
		default:
			throw RangeError('unknown private key type');
	}
}

export function publicKeyFromId(id: number, data: Uint8Array): PublicKey {
	switch (id) {
		case IdSECP256K1:
			return new SECP256K1PublicKey(data);
		case IdED25519:
			return new ED25519PublicKey(data);
		case IdSECP256R1:
			return new SECP256R1PublicKey(data);
		default:
			throw RangeError('unknown public key id');
	}
}

export function privateKeyFromId(id: number, data: Uint8Array): PrivateKey {
	switch (id) {
		case IdSECP256K1:
			return new SECP256K1PrivateKey(data);
		case IdED25519:
			return ED25519PrivateKey.fromSecretKey(data);
		case IdSECP256R1:
			return new SECP256R1PrivateKey(data);
		default:
			throw RangeError('unknown private key id');
	}
}
