import { PrivateKey } from '../private';
import { ExtendedPrivateKey } from '../hd';
import { asED25519PrivateKey, ED25519PrivateKey } from './private';

export class ED25519ExtendedPrivateKey implements ExtendedPrivateKey {
	bytes: Uint8Array;
	privateKey: ED25519PrivateKey;

	private constructor(privateKey: ED25519PrivateKey) {
		this.privateKey = privateKey;
		this.bytes = privateKey.bytes;
	}
	static fromPrivateKey(privateKey: PrivateKey): ED25519ExtendedPrivateKey {
		return new this(asED25519PrivateKey(privateKey));
	}
}
