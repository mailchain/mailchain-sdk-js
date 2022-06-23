import { ec as EC } from 'elliptic';
import { KeyExchange } from '../';
import { PrivateKey, PublicKey, RandomFunction, secureRandom } from '../../';
import { SECP256K1PrivateKey } from '../../secp256k1';

export class SECP256K1KeyExchange implements KeyExchange {
	randomFunc: RandomFunction;
	ec: EC;
	constructor(randomFunc: RandomFunction = secureRandom) {
		this.randomFunc = randomFunc;
		this.ec = new EC('secp256k1');
	}

	async EphemeralKey(): Promise<PrivateKey> {
		return SECP256K1PrivateKey.generate(this.randomFunc);
	}

	async SharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array> {
		if (privateKey.publicKey.bytes.toString() === publicKey.bytes.toString()) {
			throw new Error('public key can not be from private key');
		}

		// ephemeral private key
		const prvKey = this.ec.keyFromPrivate(privateKey.bytes);
		// recipient public key
		const pubKey = this.ec.keyFromPublic(publicKey.bytes);

		const bp = pubKey.getPublic().mul(prvKey.getPrivate());
		const buf = bp.getX().toArrayLike(Buffer, 'be', 32);

		return new Uint8Array(buf);
	}
}
