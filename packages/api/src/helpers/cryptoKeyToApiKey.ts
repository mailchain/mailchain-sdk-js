import { KindED25519, KindSECP256K1, KindSECP256R1, PrivateKey, PublicKey } from '@mailchain/crypto';
import { encodeHexZeroX } from '@mailchain/encoding';
import {
	PublicKey as ApiPublicKey,
	PrivateKey as ApiPrivateKey,
	PublicKeyCurveEnum,
	PrivateKeyCurveEnum,
} from '../api/api';
import { ErrorUnsupportedKey } from './errors';

/** Convert {@link PublicKey} to {@link ApiPublicKey}. */
export function convertPublic(key: PublicKey): ApiPublicKey {
	switch (key.curve) {
		case KindED25519:
			return { curve: PublicKeyCurveEnum.Ed25519, value: encodeHexZeroX(key.bytes), encoding: 'hex/0x-prefix' };
		case KindSECP256K1:
			return { curve: PublicKeyCurveEnum.Secp256k1, value: encodeHexZeroX(key.bytes), encoding: 'hex/0x-prefix' };
		case KindSECP256R1:
			return { curve: PublicKeyCurveEnum.Secp256r1, value: encodeHexZeroX(key.bytes), encoding: 'hex/0x-prefix' };
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

/** Convert {@link PrivateKey} to {@link ApiPrivateKey} */
export function convertPrivate(key: PrivateKey): ApiPrivateKey {
	switch (key.curve) {
		case KindED25519:
			return { curve: PrivateKeyCurveEnum.Ed25519, value: encodeHexZeroX(key.bytes), encoding: 'hex/0x-prefix' };
		case KindSECP256K1:
			return {
				curve: PrivateKeyCurveEnum.Secp256k1,
				value: encodeHexZeroX(key.bytes),
				encoding: 'hex/0x-prefix',
			};
		case KindSECP256R1:
			return {
				curve: PrivateKeyCurveEnum.Secp256r1,
				value: encodeHexZeroX(key.bytes),
				encoding: 'hex/0x-prefix',
			};
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
