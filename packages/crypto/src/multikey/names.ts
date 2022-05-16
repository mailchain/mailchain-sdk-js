import { PublicKey, KindSECP256K1, KindED25519, KindSR25519 } from '..';
import { SECP256K1PublicKey } from '../secp256k1';
import { ED25519PublicKey } from '../ed25519';
import { SR25519PublicKey } from '../sr25519';

export function KindFromPublicKey(key: PublicKey): string {
	switch (key.constructor) {
		case SECP256K1PublicKey:
			return KindSECP256K1;
		case ED25519PublicKey:
			return KindED25519;
		case SR25519PublicKey:
			return KindSR25519;
		default:
			throw RangeError('unknown public key type');
	}
}

export function PublicKeyFromKind(kind: string, data: Uint8Array): PublicKey {
	switch (kind) {
		case KindSECP256K1:
			return new SECP256K1PublicKey(data);
		case KindED25519:
			return new ED25519PublicKey(data);
		case KindSR25519:
			return new SR25519PublicKey(data);
		default:
			throw RangeError('unknown public key type');
	}
}
