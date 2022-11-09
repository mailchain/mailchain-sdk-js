import { sr25519Sign, sr25519PairFromSeed, cryptoWaitReady } from '@polkadot/util-crypto';
import { Keypair } from '@polkadot/util-crypto/types';
import { RandomFunction, secureRandom } from '../rand';
import { PrivateKey } from '../private';
import { PublicKey } from '../public';
import { KindSR25519 } from '../keys';
import { toSeed } from '../mnemonic/mnemonic';
import { SR25519PublicKey, SR25519PublicKeyLen } from './public';

export const SR25519SecretKeyLength = 64;
export const SR25519SerializedPrivateKeyLength = SR25519SecretKeyLength + SR25519PublicKeyLen;
export const SR25519SeedLength = 32;

export class SR25519PrivateKey implements PrivateKey {
	readonly bytes: Uint8Array;
	readonly publicKey: PublicKey;
	readonly keyPair: Keypair;
	readonly curve: string = KindSR25519;

	private constructor(keyPair: Keypair) {
		if (keyPair.publicKey.length !== SR25519PublicKeyLen) {
			throw new Error(`publicKey must be ${SR25519PublicKeyLen} bytes`);
		}

		if (keyPair.secretKey.length !== SR25519SecretKeyLength) {
			throw new Error(`secretKey must be ${SR25519SecretKeyLength} bytes`);
		}

		this.keyPair = keyPair;

		// set bytes to the full key
		this.bytes = new Uint8Array(SR25519PublicKeyLen + SR25519SecretKeyLength);
		this.bytes.set(keyPair.secretKey, 0);
		this.bytes.set(keyPair.publicKey, SR25519SecretKeyLength);

		this.publicKey = new SR25519PublicKey(this.keyPair.publicKey);
	}
	static generate(rand: RandomFunction = secureRandom): Promise<PrivateKey> {
		return this.fromSeed(rand(SR25519SeedLength));
	}

	static async fromMnemonicPhrase(mnemonic: string, password?: string): Promise<SR25519PrivateKey> {
		return SR25519PrivateKey.fromSeed(toSeed(mnemonic, password, SR25519SeedLength));
	}

	static async fromSeed(bytes: Uint8Array): Promise<SR25519PrivateKey> {
		if (bytes.length !== SR25519SeedLength) {
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
		if (bytes.length !== SR25519PublicKeyLen + SR25519SecretKeyLength) {
			throw new Error(`full key must be ${SR25519PublicKeyLen + SR25519SecretKeyLength} bytes`);
		}

		return new this({
			secretKey: bytes.slice(0, SR25519SecretKeyLength),
			publicKey: bytes.slice(SR25519SecretKeyLength, SR25519PublicKeyLen + SR25519SecretKeyLength),
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
