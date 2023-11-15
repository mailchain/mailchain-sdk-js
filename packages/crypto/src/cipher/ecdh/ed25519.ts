import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';
import { KeyExchange } from '../';
import { RandomFunction, secureRandom } from '../../rand';
import { PublicKey } from '../../public';
import { PrivateKey } from '../../private';
import { ED25519PublicKey } from '../../ed25519/public';
import { ED25519PrivateKey, asED25519PrivateKey } from '../../ed25519/private';

export class ED25519KeyExchange implements KeyExchange {
	randomFunc: RandomFunction;
	constructor(randomFunc: RandomFunction = secureRandom) {
		this.randomFunc = randomFunc;
	}

	async EphemeralKey(): Promise<PrivateKey> {
		return ED25519PrivateKey.generate(this.randomFunc);
	}

	async SharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array> {
		if (privateKey.publicKey.bytes.toString() === publicKey.bytes.toString()) {
			throw new Error('public key can not be from private key');
		}

		const publicKeyBytes = ED25519KeyExchange.publicKeyToCurve25519(publicKey);
		const privateKeyBytes = ED25519KeyExchange.privateKeyToCurve25519(asED25519PrivateKey(privateKey));

		return nacl.scalarMult(privateKeyBytes, publicKeyBytes);
	}

	static privateKeyToCurve25519(privateKey: ED25519PrivateKey): Uint8Array {
		return ed2curve.convertSecretKey(privateKey.bytes);
	}

	static publicKeyToCurve25519(publicKey: ED25519PublicKey): Uint8Array {
		const output = ed2curve.convertPublicKey(publicKey.bytes);
		if (output === null) {
			throw new Error('invalid public key');
		}
		return output;
	}
}
