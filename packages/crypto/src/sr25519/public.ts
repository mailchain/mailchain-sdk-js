import { cryptoWaitReady, sr25519Verify } from '@polkadot/util-crypto';
import { PublicKey } from '../';

export const PublicKeyLen = 32;

export class SR25519PublicKey implements PublicKey {
	readonly Bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== PublicKeyLen) {
			throw new RangeError('invalid public key length');
		}
		this.Bytes = bytes;
	}

	async Verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}

		return sr25519Verify(message, sig, this.Bytes);
	}
}

export function AsPublicKey(key: PublicKey): SR25519PublicKey {
	if (key.constructor !== SR25519PublicKey) {
		throw new Error('key must be sr25519');
	}

	return key;
}
