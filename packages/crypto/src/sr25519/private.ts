import { sr25519Sign, sr25519PairFromSeed, cryptoWaitReady } from '@polkadot/util-crypto';
import { Keypair } from '@polkadot/util-crypto/types';
import { RandomFunction, SecureRandom } from '../rand';
import { PrivateKey, PublicKey } from '../';
import { toSeed } from '../mnemonic/mnemonic';
import { SR25519PublicKey, PublicKeyLen } from './public';

export const SecretKeyLength = 64;
export const SerializedPrivateKeyLength = SecretKeyLength + PublicKeyLen;
export const SeedLength = 32;

export class SR25519PrivateKey implements PrivateKey {
	readonly Bytes: Uint8Array;
	readonly PublicKey: PublicKey;
	readonly Keypair: Keypair;

	private constructor(keypair: Keypair) {
		if (keypair.publicKey.length !== PublicKeyLen) {
			throw new Error(`publicKey must be ${PublicKeyLen} bytes`);
		}

		if (keypair.secretKey.length !== SecretKeyLength) {
			throw new Error(`secretKey must be ${SecretKeyLength} bytes`);
		}

		this.Keypair = keypair;

		// set bytes to the full key
		this.Bytes = new Uint8Array(PublicKeyLen + SecretKeyLength);
		this.Bytes.set(keypair.secretKey, 0);
		this.Bytes.set(keypair.publicKey, SecretKeyLength);

		this.PublicKey = new SR25519PublicKey(this.Keypair.publicKey);
	}
	static Generate(rand: RandomFunction = SecureRandom): Promise<PrivateKey> {
		return this.FromSeed(rand(SeedLength));
	}

	static async FromMnemonicPhrase(mnemonic: string, password?: string): Promise<SR25519PrivateKey> {
		return SR25519PrivateKey.FromSeed(toSeed(mnemonic, password, SeedLength));
	}

	static async FromSeed(bytes: Uint8Array): Promise<SR25519PrivateKey> {
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

	static FromKeypair(keyPair: { publicKey: Uint8Array; secretKey: Uint8Array }): SR25519PrivateKey {
		return new this(keyPair);
	}

	static FromBytes(bytes: Uint8Array): SR25519PrivateKey {
		if (bytes.length !== PublicKeyLen + SecretKeyLength) {
			throw new Error(`full key must be ${PublicKeyLen + SecretKeyLength} bytes`);
		}

		return new this({
			secretKey: bytes.slice(0, SecretKeyLength),
			publicKey: bytes.slice(SecretKeyLength, PublicKeyLen + SecretKeyLength),
		});
	}

	async Sign(message: Uint8Array): Promise<Uint8Array> {
		const ready = await cryptoWaitReady(); // needed before calling sr25519Sign
		if (!ready) {
			throw new Error('crypto libraries could not be initialized');
		}

		return sr25519Sign(message, this.Keypair);
	}
}

export function AsSR25519PrivateKey(key: PrivateKey): SR25519PrivateKey {
	if (key.constructor !== SR25519PrivateKey) {
		throw new Error('key must be sr25519');
	}

	return key;
}
