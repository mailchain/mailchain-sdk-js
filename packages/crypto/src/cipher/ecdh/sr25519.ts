import { cryptoWaitReady, sr25519Agreement } from '@polkadot/util-crypto';
import { KeyExchange } from '../';
import { PrivateKey, PublicKey, RandomFunction, SecureRandom } from '../../';
import { SR25519PrivateKey, AsSR25519PrivateKey } from '../../sr25519';

export class SR25519KeyExchange implements KeyExchange {
	randomFunc: RandomFunction;
	constructor(randomFunc: RandomFunction = SecureRandom) {
		this.randomFunc = randomFunc;
	}

	async EphemeralKey(): Promise<PrivateKey> {
		return SR25519PrivateKey.Generate(this.randomFunc);
	}

	async SharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}
		if (privateKey.PublicKey.Bytes.toString() === publicKey.Bytes.toString()) {
			throw new Error('public key can not be from private key');
		}

		return sr25519Agreement(AsSR25519PrivateKey(privateKey).Keypair.secretKey, publicKey.Bytes);
	}
}
