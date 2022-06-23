import { PrivateKey, PublicKey } from '..';
import { IdFromPrivateKey, IdFromPublicKey, PrivateKeyFromId, PublicKeyFromId } from './ids';

export function EncodePublicKey(key: PublicKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = IdFromPublicKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function DecodePublicKey(encoded: Uint8Array): PublicKey {
	if (encoded.length < 32 + 1) {
		throw Error('encoded public key is too short');
	}
	return PublicKeyFromId(encoded[0], encoded.slice(1));
}

export function EncodePrivateKey(key: PrivateKey): Uint8Array {
	const out = new Uint8Array(key.bytes.length + 1);

	out[0] = IdFromPrivateKey(key);
	out.set(key.bytes, 1);

	return out;
}

export function DecodePrivateKey(encoded: Uint8Array): PrivateKey {
	if (encoded.length < 32 + 1) {
		throw Error('encoded private key is too short');
	}

	return PrivateKeyFromId(encoded[0], encoded.slice(1));
}
