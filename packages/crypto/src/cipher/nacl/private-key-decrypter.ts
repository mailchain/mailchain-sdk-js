import { IdFromPrivateKey } from '@mailchain/crypto/multikey/ids';
import { convertSecretKeyToCurve25519 } from '@polkadot/util-crypto/ed25519/convertKey';
import { EncryptedContent, PlainContent, Decrypter } from '..';
import { PrivateKey } from '../..';
import { SECP256K1PrivateKey } from '../../secp256k1';
import { ED25519PrivateKey } from '../../ed25519';
import { SR25519PrivateKey } from '../../sr25519';
import { deserializePrivateKeyEncryptedContent } from './serialization';
import { easyOpen } from './secretbox';

export class PrivateKeyDecrypter implements Decrypter {
	private _secretKey: Uint8Array;
	private _keyId: number;

	constructor(privateKey: PrivateKey) {
		this._keyId = IdFromPrivateKey(privateKey);

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
	static fromPrivateKey(key: PrivateKey): PrivateKeyDecrypter {
		return new this(key);
	}

	async Decrypt(input: EncryptedContent): Promise<PlainContent> {
		const secretData = deserializePrivateKeyEncryptedContent(input);
		if (this._keyId !== secretData.keyId) {
			throw Error('key id does not match supplied key');
		}

		return easyOpen(secretData.encryptedContent, this._secretKey);
	}
}
