import { convertSecretKeyToCurve25519, convertPublicKeyToCurve25519 } from '@polkadot/util-crypto';
import { scalarMult } from 'tweetnacl';
import { KeyExchange } from '../';
import { PrivateKey, PublicKey, RandomFunction, SecureRandom } from '../../';
import { ED25519PrivateKey, ED25519PublicKey, AsED25519PrivateKey } from '../../ed25519';

export class ED25519KeyExchange implements KeyExchange {
	randomFunc: RandomFunction;
	constructor(randomFunc: RandomFunction = SecureRandom) {
		this.randomFunc = randomFunc;
	}

	async EphemeralKey(): Promise<PrivateKey> {
		return ED25519PrivateKey.Generate(this.randomFunc);
	}

	async SharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array> {
		if (privateKey.PublicKey.Bytes.toString() === publicKey.Bytes.toString()) {
			throw new Error('public key can not be from private key');
		}

		const publicKeyBytes = ED25519KeyExchange.publicKeyToCurve25519(publicKey);
		const privateKeyBytes = ED25519KeyExchange.privateKeyToCurve25519(AsED25519PrivateKey(privateKey));

		return scalarMult(privateKeyBytes, publicKeyBytes);
	}

	static privateKeyToCurve25519(privateKey: ED25519PrivateKey): Uint8Array {
		return convertSecretKeyToCurve25519(privateKey.Bytes);
	}

	static publicKeyToCurve25519(publicKey: ED25519PublicKey): Uint8Array {
		return convertPublicKeyToCurve25519(publicKey.Bytes);
	}
}
