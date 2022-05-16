import { ed25519Verify } from '@polkadot/util-crypto';
import { PublicKey } from '../';

export const PublicKeyLen = 32;

export class ED25519PublicKey implements PublicKey {
	readonly Bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== PublicKeyLen) {
			throw new RangeError('invalid public key length');
		}
		this.Bytes = bytes;
	}

	async Verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		return ed25519Verify(message, sig, this.Bytes);
	}
}

export function AsED25519PublicKey(key: PublicKey): ED25519PublicKey {
	if (key.constructor !== ED25519PublicKey) {
		throw new Error('key must be ed25519');
	}

	return key;
}
