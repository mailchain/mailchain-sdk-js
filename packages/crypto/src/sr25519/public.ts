import { cryptoWaitReady, sr25519Verify } from '@polkadot/util-crypto';
import { KindSR25519, PublicKey } from '../';

export const SR25519PublicKeyLen = 32;

export class SR25519PublicKey implements PublicKey {
	readonly bytes: Uint8Array;
	readonly curve: string = KindSR25519;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== SR25519PublicKeyLen) {
			throw new RangeError('invalid public key length');
		}
		this.bytes = bytes;
	}

	async verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}

		return sr25519Verify(message, sig, this.bytes);
	}
}

export function asPublicKey(key: PublicKey): SR25519PublicKey {
	if (key.constructor !== SR25519PublicKey) {
		throw new Error('key must be sr25519');
	}

	return key;
}
