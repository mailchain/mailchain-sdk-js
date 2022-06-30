import { EncryptedContent, Encrypter, KeyExchange } from '..';
import { PublicKey, RandomFunction, secureRandom } from '../..';
import { FromPublicKey } from '../ecdh/ecdh';
import { easySeal } from './secretbox';
import { serializePublicKeyEncryptedContent } from './serialization';

export class PublicKeyEncrypter implements Encrypter {
	private _keyEx: KeyExchange;
	private _pubKey: PublicKey;
	private _rand: RandomFunction;

	constructor(keyEx: KeyExchange, pubKey: PublicKey, rand: RandomFunction = secureRandom) {
		this._rand = rand;
		this._keyEx = keyEx;
		this._pubKey = pubKey;
	}
	static FromPublicKey(key: PublicKey): PublicKeyEncrypter {
		return new this(FromPublicKey(key), key);
	}

	async encrypt(input: Uint8Array): Promise<EncryptedContent> {
		const ephemeralPrvKey = await this._keyEx.EphemeralKey();
		const sharedSecret = await this._keyEx.SharedSecret(ephemeralPrvKey, this._pubKey);
		const sealedBox = easySeal(input, sharedSecret, this._rand);

		return serializePublicKeyEncryptedContent(sealedBox, ephemeralPrvKey.publicKey);
	}
}
