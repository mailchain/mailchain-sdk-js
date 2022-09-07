import { ed25519Sign, ed25519PairFromSeed, ed25519PairFromSecret } from '@polkadot/util-crypto';
import { Keypair } from '@polkadot/util-crypto/types';
import { toSeed } from '../mnemonic/mnemonic';
import { RandomFunction, secureRandom } from '../rand';
import { KindED25519, PrivateKey, PublicKey } from '../';
import { ED25519PublicKey } from './public';

export const ED25519PrivateKeyLength = 64;
export const ED25519SeedLength = 32;

export class ED25519PrivateKey implements PrivateKey {
	readonly bytes: Uint8Array;
	readonly publicKey: PublicKey;
	readonly curve: string = KindED25519;
	readonly keyPair: Keypair;

	constructor(keyPair: Keypair) {
		this.keyPair = keyPair;
		this.bytes = this.keyPair.secretKey;
		this.publicKey = new ED25519PublicKey(this.keyPair.publicKey);
	}

	static fromSeed(seed: Uint8Array): ED25519PrivateKey {
		if (seed.length !== ED25519SeedLength) {
			throw Error('seed must be 32 bytes');
		}
		return new this(ed25519PairFromSeed(seed, true));
	}

	static fromSecretKey(secretKey: Uint8Array): ED25519PrivateKey {
		if (secretKey.length !== ED25519PrivateKeyLength) {
			throw Error('secret key must be 64 bytes');
		}
		return new this(ed25519PairFromSecret(secretKey));
	}

	static fromMnemonicPhrase(mnemonic: string, password = ''): ED25519PrivateKey {
		return this.fromSeed(toSeed(mnemonic, password, ED25519SeedLength));
	}

	static generate(rand: RandomFunction = secureRandom): ED25519PrivateKey {
		return this.fromSeed(rand(ED25519SeedLength));
	}

	async sign(message: Uint8Array): Promise<Uint8Array> {
		return ed25519Sign(message, this.keyPair);
	}
}

export function asED25519PrivateKey(key: PrivateKey): ED25519PrivateKey {
	if (key.constructor !== ED25519PrivateKey) {
		throw new Error('key must be ed25519');
	}

	return key;
}
