import ed2curve from 'ed2curve';
import { idFromPrivateKey } from '../../multikey/ids';
import { EncryptedContent, Encrypter } from '../cipher';
import { RandomFunction, secureRandom } from '../../rand';
import { PrivateKey } from '../../private';
import { SECP256K1PrivateKey } from '../../secp256k1/private';
import { ED25519PrivateKey } from '../../ed25519/private';
import { serializePrivateKeyEncryptedContent } from './serialization';
import { easySeal } from './secretbox';

export class PrivateKeyEncrypter implements Encrypter {
	private _rand: RandomFunction;
	private _secretKey: Uint8Array;
	private _keyId: number;

	constructor(privateKey: PrivateKey, rand: RandomFunction = secureRandom) {
		this._rand = rand;
		this._keyId = idFromPrivateKey(privateKey);

		switch (privateKey.constructor) {
			case ED25519PrivateKey:
				this._secretKey = ed2curve.convertSecretKey(privateKey.bytes);
				break;
			case SECP256K1PrivateKey:
				this._secretKey = privateKey.bytes;
				break;
			default:
				throw RangeError('unknown private key type');
		}
	}
	static fromPrivateKey(key: PrivateKey, rand: RandomFunction = secureRandom): PrivateKeyEncrypter {
		return new this(key, rand);
	}

	async encrypt(input: Uint8Array): Promise<EncryptedContent> {
		const sealedBox = easySeal(input, this._secretKey, this._rand);

		return serializePrivateKeyEncryptedContent(sealedBox, this._keyId);
	}
}
