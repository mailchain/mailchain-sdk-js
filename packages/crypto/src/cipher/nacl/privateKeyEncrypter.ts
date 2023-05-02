import { convertSecretKeyToCurve25519 } from '@polkadot/util-crypto/ed25519';
import { idFromPrivateKey } from '../../multikey/ids';
import { EncryptedContent, Encrypter } from '../cipher';
import { RandomFunction, secureRandom } from '../../rand';
import { PrivateKey } from '../../private';
import { SECP256K1PrivateKey } from '../../secp256k1/private';
import { ED25519PrivateKey } from '../../ed25519/private';
import { SR25519PrivateKey } from '../../sr25519/private';
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
				this._secretKey = convertSecretKeyToCurve25519(privateKey.bytes);
				break;
			case SECP256K1PrivateKey:
				this._secretKey = privateKey.bytes;
				break;
			case SR25519PrivateKey:
				throw RangeError('sr25519 key not supported'); // need to convert key to 32 bytes
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
