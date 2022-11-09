import { EncryptedContent, PlainContent, Decrypter } from '../cipher';
import { KeyExchange } from '../keyExchange';
import { PrivateKey } from '../../private';
import { fromPrivateKey } from '../ecdh/ecdh';
import { easyOpen } from './secretbox';
import { deserializePublicKeyEncryptedContent } from './serialization';

export class PublicKeyDecrypter implements Decrypter {
	private _keyEx: KeyExchange;
	private _prvKey: PrivateKey;

	constructor(keyEx: KeyExchange, prvKey: PrivateKey) {
		this._keyEx = keyEx;
		this._prvKey = prvKey;
	}
	static FromPrivateKey(key: PrivateKey): PublicKeyDecrypter {
		return new this(fromPrivateKey(key), key);
	}

	async decrypt(input: EncryptedContent): Promise<PlainContent> {
		const secretData = deserializePublicKeyEncryptedContent(input);

		const sharedSecret = await this._keyEx.SharedSecret(this._prvKey, secretData.pubKey);

		return easyOpen(secretData.encryptedContent, sharedSecret);
	}
}
