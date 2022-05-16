import { ExtendedPrivateKey, PrivateKey } from '..';
import { AsED25519PrivateKey, ED25519PrivateKey } from '.';

export class ED25519ExtendedPrivateKey implements ExtendedPrivateKey {
	Bytes: Uint8Array;
	PrivateKey: ED25519PrivateKey;

	private constructor(privateKey: ED25519PrivateKey) {
		this.PrivateKey = privateKey;
		this.Bytes = privateKey.Bytes;
	}
	static FromPrivateKey(privateKey: PrivateKey): ED25519ExtendedPrivateKey {
		return new this(AsED25519PrivateKey(privateKey));
	}
}
