import { KindSECP256K1, KindED25519, KindSR25519 } from '../keys';
import { PublicKey } from '../public';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { ED25519PublicKey } from '../ed25519/public';
import { SR25519PublicKey } from '../sr25519/public';

export function kindFromPublicKey(key: PublicKey): string {
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

export function publicKeyFromKind(kind: string, data: Uint8Array): PublicKey {
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
