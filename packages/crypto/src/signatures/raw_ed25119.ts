import { ED25519PrivateKey, ED25519PublicKey } from '../ed25519';
import { PrivateKey } from '../private';
import { PublicKey } from '../public';
import { ErrorUnsupportedKey } from './errors';

export async function signRawEd25519(key: PrivateKey, msg: Uint8Array) {
	switch (key.constructor) {
		case ED25519PrivateKey: {
			return key.Sign(msg);
		}
		default:
			throw new ErrorUnsupportedKey();
	}
}

export async function verifyRawEd25519(key: PublicKey, msg: Uint8Array, signature: Uint8Array) {
	switch (key.constructor) {
		case ED25519PublicKey:
			return key.Verify(msg, signature);
		default:
			throw new ErrorUnsupportedKey();
	}
}
