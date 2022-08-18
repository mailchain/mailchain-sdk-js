import { KindED25519, Signer, PublicKey } from '@mailchain/crypto';
import { ErrorUnsupportedKey } from './errors';

export async function signRawEd25519(signer: Signer, msg: Uint8Array) {
	switch (signer.curve) {
		case KindED25519: {
			return signer.sign(msg);
		}
		default:
			throw new ErrorUnsupportedKey(signer.curve);
	}
}

export async function verifyRawEd25519(key: PublicKey, msg: Uint8Array, signature: Uint8Array) {
	switch (key.curve) {
		case KindED25519:
			return key.verify(msg, signature);
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
