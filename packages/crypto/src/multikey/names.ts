import { KindSECP256K1, KindED25519, KindSECP256R1 } from '../keys';
import { PublicKey } from '../public';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { ED25519PublicKey } from '../ed25519/public';
import { SECP256R1PublicKey } from '../secp256r1';

export function kindFromPublicKey(key: PublicKey): string {
	switch (key.constructor) {
		case SECP256K1PublicKey:
			return KindSECP256K1;
		case ED25519PublicKey:
			return KindED25519;
		case SECP256R1PublicKey:
			return KindSECP256R1;
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
		case KindSECP256R1:
			return new SECP256R1PublicKey(data);
		default:
			throw RangeError('unknown public key type');
	}
}
