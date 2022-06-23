import { sr25519Sign, sr25519PairFromSeed, cryptoWaitReady } from '@polkadot/util-crypto';
import { Keypair } from '@polkadot/util-crypto/types';
import { RandomFunction, secureRandom } from '../rand';
import { KindSR25519, PrivateKey, PublicKey } from '../';
import { toSeed } from '../mnemonic/mnemonic';
import { SR25519PublicKey, PublicKeyLen } from './public';

export const SecretKeyLength = 64;
export const SerializedPrivateKeyLength = SecretKeyLength + PublicKeyLen;
export const SeedLength = 32;

export class SR25519PrivateKey implements PrivateKey {
	readonly bytes: Uint8Array;
	readonly publicKey: PublicKey;
	readonly keyPair: Keypair;
	readonly curve: string = KindSR25519;

	private constructor(keyPair: Keypair) {
		if (keyPair.publicKey.length !== PublicKeyLen) {
			throw new Error(`publicKey must be ${PublicKeyLen} bytes`);
		}

		if (keyPair.secretKey.length !== SecretKeyLength) {
			throw new Error(`secretKey must be ${SecretKeyLength} bytes`);
		}

		this.keyPair = keyPair;

		// set bytes to the full key
		this.bytes = new Uint8Array(PublicKeyLen + SecretKeyLength);
		this.bytes.set(keyPair.secretKey, 0);
		this.bytes.set(keyPair.publicKey, SecretKeyLength);

		this.publicKey = new SR25519PublicKey(this.keyPair.publicKey);
	}
	static generate(rand: RandomFunction = secureRandom): Promise<PrivateKey> {
		return this.fromSeed(rand(SeedLength));
	}

	static async fromMnemonicPhrase(mnemonic: string, password?: string): Promise<SR25519PrivateKey> {
		return SR25519PrivateKey.fromSeed(toSeed(mnemonic, password, SeedLength));
	}

	static async fromSeed(bytes: Uint8Array): Promise<SR25519PrivateKey> {
		if (bytes.length !== SeedLength) {
			throw new Error('seed must be 32 byte');
		}

		const ready = await cryptoWaitReady(); // needed before calling sr25519PairFromSeed
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}

		const keyPair = sr25519PairFromSeed(bytes);

		return new this(keyPair);
	}

	static fromKeyPair(keyPair: { publicKey: Uint8Array; secretKey: Uint8Array }): SR25519PrivateKey {
		return new this(keyPair);
	}

	static fromBytes(bytes: Uint8Array): SR25519PrivateKey {
		if (bytes.length !== PublicKeyLen + SecretKeyLength) {
			throw new Error(`full key must be ${PublicKeyLen + SecretKeyLength} bytes`);
		}

		return new this({
			secretKey: bytes.slice(0, SecretKeyLength),
			publicKey: bytes.slice(SecretKeyLength, PublicKeyLen + SecretKeyLength),
		});
	}

	async sign(message: Uint8Array): Promise<Uint8Array> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}

		return sr25519Sign(message, this.keyPair);
	}
}

export function asSR25519PrivateKey(key: PrivateKey): SR25519PrivateKey {
	if (key.constructor !== SR25519PrivateKey) {
		throw new Error('key must be sr25519');
	}

	return key;
}
