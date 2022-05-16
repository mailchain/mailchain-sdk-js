import { privateKeyVerify, publicKeyCreate, ecdsaSign } from 'secp256k1';
import { DecodeHexZeroX } from '@mailchain/encoding';
import { hashMessage } from 'ethers/lib/utils';
import { RandomFunction, SecureRandom } from '../rand';
import { PrivateKey } from '../';
import { SECP256K1PublicKey } from './public';
export const PrivateKeyLen = 32;

export class SECP256K1PrivateKey implements PrivateKey {
	Bytes: Uint8Array;
	readonly PublicKey: SECP256K1PublicKey;

	constructor(bytes: Uint8Array) {
		this.Bytes = bytes;

		if (!privateKeyVerify(this.Bytes)) {
			throw RangeError('bytes are not a valid ECDSA private key');
		}

		this.PublicKey = new SECP256K1PublicKey(publicKeyCreate(this.Bytes));
	}
	static Generate(rand: RandomFunction = SecureRandom): SECP256K1PrivateKey {
		return new this(rand(PrivateKeyLen));
	}

	async Sign(message: Uint8Array): Promise<Uint8Array> {
		// sign as an ethereum personal message
		const messageToVerify = DecodeHexZeroX(hashMessage(message));
		const sigObj = ecdsaSign(messageToVerify, this.Bytes);

		const ret = new Uint8Array(65);
		ret.set(sigObj.signature, 0);
		ret.set(new Uint8Array([sigObj.recid]), 64);
		return ret;
	}
}
