import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { idFromPrivateKey, idFromPublicKey, privateKeyFromId, publicKeyFromId } from './ids';

export function publicKeyToBytes(key: PublicKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = idFromPublicKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function publicKeyFromBytes(bytes: Uint8Array): PublicKey {
	if (bytes.length < 32 + 1) {
		throw Error('public key is too short to contain ID byte');
	}
	return publicKeyFromId(bytes[0], bytes.slice(1));
}

export function privateKeyToBytes(key: PrivateKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = idFromPrivateKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function privateKeyFromBytes(bytes: Uint8Array): PrivateKey {
	if (bytes.length < 32 + 1) {
		throw Error('private key is too short to contain ID byte');
	}

	return privateKeyFromId(bytes[0], bytes.slice(1));
}
