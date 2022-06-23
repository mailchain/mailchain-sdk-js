import { ExtendedPrivateKey, PrivateKey } from '..';
import { asSR25519PrivateKey, SR25519PrivateKey } from '.';

export class SR25519ExtendedPrivateKey implements ExtendedPrivateKey {
	bytes: Uint8Array;
	privateKey: PrivateKey;

	private constructor(privateKey: SR25519PrivateKey) {
		this.privateKey = privateKey;
		this.bytes = privateKey.bytes;
	}
	static FromPrivateKey(privateKey: SR25519PrivateKey): SR25519ExtendedPrivateKey {
		return new this(asSR25519PrivateKey(privateKey));
	}
}
