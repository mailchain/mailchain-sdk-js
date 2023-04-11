import { privateKeyVerify, publicKeyCreate, ecdsaSign } from 'secp256k1';
import { RandomFunction, secureRandom } from '../rand';
import { KindSECP256K1 } from '../keys';
import { PrivateKey } from '../private';
import { SECP256K1PublicKey } from './public';
export const PrivateKeyLen = 32;

export class SECP256K1PrivateKey implements PrivateKey {
	bytes: Uint8Array;
	readonly publicKey: SECP256K1PublicKey;
	readonly curve: string = KindSECP256K1;

	constructor(bytes: Uint8Array) {
		this.bytes = bytes;

		if (!privateKeyVerify(this.bytes)) {
			throw RangeError('bytes are not a i9valid ECDSA private key');
		}

		this.publicKey = new SECP256K1PublicKey(publicKeyCreate(this.bytes));
	}
	static generate(rand: RandomFunction = secureRandom): SECP256K1PrivateKey {
		return new this(rand(PrivateKeyLen));
	}
	async sign(message: Uint8Array): Promise<Uint8Array> {
		const sigObj = ecdsaSign(message, this.bytes);

		const ret = new Uint8Array(65);
		ret.set(sigObj.signature, 0);
		ret.set(new Uint8Array([sigObj.recid]), 64);
		return ret;
	}
}
