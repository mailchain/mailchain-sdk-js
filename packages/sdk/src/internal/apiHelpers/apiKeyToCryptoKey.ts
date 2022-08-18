import {
	PrivateKey,
	PublicKey,
	ED25519PrivateKey,
	ED25519PublicKey,
	SECP256K1PublicKey,
	SECP256K1PrivateKey,
	SR25519PrivateKey,
	SR25519PublicKey,
} from '@mailchain/crypto';
import { decode } from '@mailchain/encoding';
import { ErrorUnsupportedKey } from '../signatures/errors';
import {
	PrivateKey as ApiPrivateKey,
	PrivateKeyCurveEnum,
	PublicKey as ApiPublicKey,
	PublicKeyCurveEnum,
} from '../api';

/** Convert {@link ApiPublicKey} to {@link PublicKey} */
export function convertPublic(key: ApiPublicKey): PublicKey {
	switch (key.curve) {
		case PublicKeyCurveEnum.Ed25519:
			return new ED25519PublicKey(decode(key.encoding, key.value));
		case PublicKeyCurveEnum.Secp256k1:
			return new SECP256K1PublicKey(decode(key.encoding, key.value));
		case PrivateKeyCurveEnum.Sr25519:
			return new SR25519PublicKey(decode(key.encoding, key.value));
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

/** Convert {@link ApiPrivateKey} to {@link PrivateKey} */
export function convertPrivate(key: ApiPrivateKey): PrivateKey {
	switch (key.curve) {
		case PrivateKeyCurveEnum.Ed25519:
			return ED25519PrivateKey.fromSeed(decode(key.encoding, key.value));
		case PrivateKeyCurveEnum.Secp256k1:
			return new SECP256K1PrivateKey(decode(key.encoding, key.value));
		case PrivateKeyCurveEnum.Sr25519:
			return SR25519PrivateKey.fromBytes(decode(key.encoding, key.value));
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
