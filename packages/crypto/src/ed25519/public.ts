import { ed25519Verify } from '@polkadot/util-crypto';
import { KindED25519 } from '../keys';
import { PublicKey } from '../public';

export const ED25519PublicKeyLen = 32;

export class ED25519PublicKey implements PublicKey {
	readonly curve: string = KindED25519;
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== ED25519PublicKeyLen) {
			throw new RangeError('invalid public key length');
		}
		this.bytes = bytes;
	}

	async verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		return ed25519Verify(message, sig, this.bytes);
	}
}

export function asED25519PublicKey(key: PublicKey): ED25519PublicKey {
	if (key.constructor !== ED25519PublicKey) {
		throw new Error('key must be ed25519');
	}

	return key;
}
