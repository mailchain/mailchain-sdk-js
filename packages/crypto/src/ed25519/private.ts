import { ed25519Sign, ed25519PairFromSeed, ed25519PairFromSecret } from '@polkadot/util-crypto';
import { Keypair } from '@polkadot/util-crypto/types';
import { toSeed } from '../mnemonic/mnemonic';
import { RandomFunction, SecureRandom } from '../rand';
import { PrivateKey, PublicKey } from '../';
import { ED25519PublicKey } from './public';

export const PrivateKeyLength = 64;
export const SeedLength = 32;

export class ED25519PrivateKey implements PrivateKey {
	readonly Bytes: Uint8Array;
	readonly PublicKey: PublicKey;

	readonly KeyPair: Keypair;

	constructor(keyPair: Keypair) {
		this.KeyPair = keyPair;
		this.Bytes = this.KeyPair.secretKey;
		this.PublicKey = new ED25519PublicKey(this.KeyPair.publicKey);
	}
	static FromSeed(seed: Uint8Array): ED25519PrivateKey {
		if (seed.length !== SeedLength) {
			throw Error('seed must be 32 bytes');
		}
		return new this(ed25519PairFromSeed(seed, true));
	}

	static FromSecretKey(secretKey: Uint8Array): ED25519PrivateKey {
		if (secretKey.length !== PrivateKeyLength) {
			throw Error('secret key must be 64 bytes');
		}
		return new this(ed25519PairFromSecret(secretKey));
	}

	static FromMnemonicPhrase(mnemonic: string, password?: string): ED25519PrivateKey {
		return this.FromSeed(toSeed(mnemonic, password, SeedLength));
	}

	static Generate(rand: RandomFunction = SecureRandom): ED25519PrivateKey {
		return this.FromSeed(rand(SeedLength));
	}

	Sign = async (message: Uint8Array): Promise<Uint8Array> => {
		return ed25519Sign(message, this.KeyPair);
	};
}

export function AsED25519PrivateKey(key: PrivateKey): ED25519PrivateKey {
	if (key.constructor !== ED25519PrivateKey) {
		throw new Error('key must be ed25519');
	}

	return key;
}
