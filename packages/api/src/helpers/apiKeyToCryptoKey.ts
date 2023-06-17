import {
	PrivateKey,
	PublicKey,
	ED25519PrivateKey,
	ED25519PublicKey,
	SECP256K1PublicKey,
	SECP256K1PrivateKey,
} from '@mailchain/crypto';
import { decode } from '@mailchain/encoding';
import { SECP256R1PrivateKey, SECP256R1PublicKey } from '@mailchain/crypto/secp256r1';
import {
	PrivateKey as ApiPrivateKey,
	PrivateKeyCurveEnum,
	PublicKey as ApiPublicKey,
	PublicKeyCurveEnum,
} from '../api/api';
import { ErrorUnsupportedKey } from './errors';

/** Convert {@link ApiPublicKey} to {@link PublicKey} */
export function convertPublic(key: ApiPublicKey): PublicKey {
	switch (key.curve) {
		case PublicKeyCurveEnum.Ed25519:
			return new ED25519PublicKey(decode(key.encoding, key.value));
		case PublicKeyCurveEnum.Secp256k1:
			return new SECP256K1PublicKey(decode(key.encoding, key.value));
		case PublicKeyCurveEnum.Secp256r1:
			return new SECP256R1PublicKey(decode(key.encoding, key.value));
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

/** Convert {@link ApiPrivateKey} to {@link PrivateKey} */
export function convertPrivate(key: ApiPrivateKey): PrivateKey {
	switch (key.curve) {
		case PrivateKeyCurveEnum.Ed25519:
			return ED25519PrivateKey.fromSecretKey(decode(key.encoding, key.value));
		case PrivateKeyCurveEnum.Secp256k1:
			return new SECP256K1PrivateKey(decode(key.encoding, key.value));
		case PrivateKeyCurveEnum.Secp256r1:
			return new SECP256R1PrivateKey(decode(key.encoding, key.value));
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
