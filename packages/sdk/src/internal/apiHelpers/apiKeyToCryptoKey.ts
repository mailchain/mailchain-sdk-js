import { PrivateKey, PublicKey } from '@mailchain/crypto';
import { ED25519PrivateKey, ED25519PublicKey } from '@mailchain/crypto/ed25519';
import { SECP256K1PublicKey, SECP256K1PrivateKey } from '@mailchain/crypto/secp256k1';
import { ErrorUnsupportedKey } from '@mailchain/crypto/signatures/errors';
import { SR25519PrivateKey, SR25519PublicKey } from '@mailchain/crypto/sr25519';
import { decode } from '@mailchain/encoding/encoding';
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
