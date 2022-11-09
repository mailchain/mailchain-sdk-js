import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { idFromPrivateKey, idFromPublicKey, privateKeyFromId, publicKeyFromId } from './ids';

export function encodePublicKey(key: PublicKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = idFromPublicKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function decodePublicKey(encoded: Uint8Array): PublicKey {
	if (encoded.length < 32 + 1) {
		throw Error('encoded public key is too short');
	}
	return publicKeyFromId(encoded[0], encoded.slice(1));
}

export function encodePrivateKey(key: PrivateKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = idFromPrivateKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function decodePrivateKey(encoded: Uint8Array): PrivateKey {
	if (encoded.length < 32 + 1) {
		throw Error('encoded private key is too short');
	}

	return privateKeyFromId(encoded[0], encoded.slice(1));
}
