import { cryptoWaitReady, sr25519Agreement } from '@polkadot/util-crypto';
import { KeyExchange } from '../';
import { RandomFunction, secureRandom } from '../../rand';
import { PublicKey } from '../../public';
import { PrivateKey } from '../../private';
import { SR25519PrivateKey, asSR25519PrivateKey } from '../../sr25519/private';

export class SR25519KeyExchange implements KeyExchange {
	randomFunc: RandomFunction;
	constructor(randomFunc: RandomFunction = secureRandom) {
		this.randomFunc = randomFunc;
	}

	async EphemeralKey(): Promise<PrivateKey> {
		return SR25519PrivateKey.generate(this.randomFunc);
	}

	async SharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}
		if (privateKey.publicKey.bytes.toString() === publicKey.bytes.toString()) {
			throw new Error('public key can not be from private key');
		}

		return sr25519Agreement(asSR25519PrivateKey(privateKey).keyPair.secretKey, publicKey.bytes);
	}
}
