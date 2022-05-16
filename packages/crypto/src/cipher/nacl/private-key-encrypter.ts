import { IdFromPrivateKey } from '@mailchain/crypto/multikey';
import { convertSecretKeyToCurve25519 } from '@polkadot/util-crypto';
import { EncryptedContent, Encrypter } from '..';
import { PrivateKey, RandomFunction, SecureRandom } from '../..';
import { SECP256K1PrivateKey } from '../../secp256k1';
import { ED25519PrivateKey } from '../../ed25519';
import { SR25519PrivateKey } from '../../sr25519';
import { serializePrivateKeyEncryptedContent } from './serialization';
import { easySeal } from './secretbox';

export class PrivateKeyEncrypter implements Encrypter {
	private _rand: RandomFunction;
	private _secretKey: Uint8Array;
	private _keyId: number;

	constructor(privateKey: PrivateKey, rand: RandomFunction = SecureRandom) {
		this._rand = rand;
		this._keyId = IdFromPrivateKey(privateKey);

		switch (privateKey.constructor) {
			case ED25519PrivateKey:
				this._secretKey = convertSecretKeyToCurve25519(privateKey.Bytes);
				break;
			case SECP256K1PrivateKey:
				this._secretKey = privateKey.Bytes;
				break;
			case SR25519PrivateKey:
				throw RangeError('sr25519 key not supported'); // need to convert key to 32 bytes
			default:
				throw RangeError('unknown private key type');
		}
	}
	static FromPrivateKey(key: PrivateKey, rand: RandomFunction = SecureRandom): PrivateKeyEncrypter {
		return new this(key, rand);
	}

	async Encrypt(input: Uint8Array): Promise<EncryptedContent> {
		const sealedBox = easySeal(input, this._secretKey, this._rand);

		return serializePrivateKeyEncryptedContent(sealedBox, this._keyId);
	}
}
