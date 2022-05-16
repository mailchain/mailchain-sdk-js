import { ExtendedPrivateKey, PrivateKey } from '..';
import { AsSR25519PrivateKey, SR25519PrivateKey } from '.';

export class SR25519ExtendedPrivateKey implements ExtendedPrivateKey {
	Bytes: Uint8Array;
	PrivateKey: PrivateKey;

	private constructor(privateKey: SR25519PrivateKey) {
		this.PrivateKey = privateKey;
		this.Bytes = privateKey.Bytes;
	}
	static FromPrivateKey(privateKey: SR25519PrivateKey): SR25519ExtendedPrivateKey {
		return new this(AsSR25519PrivateKey(privateKey));
	}
}
