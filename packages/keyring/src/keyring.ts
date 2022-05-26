import {
	ED25519PrivateKey,
	DeriveHardenedKey,
	ED25519ExtendedPrivateKey,
	AsED25519PublicKey,
	AsED25519PrivateKey,
} from '@mailchain/crypto/ed25519';
import { EncodeBase58 } from '@mailchain/encoding/base58';
import { PublicKey as IPublicKey } from '@mailchain/crypto';
import { EncodeBase64UrlSafe, EncodeHexZeroX } from '@mailchain/encoding';
import { DERIVATION_PATH_ENCRYPTION_KEY_ROOT, DERIVATION_PATH_IDENTITY_KEY_ROOT } from './constants';

export class KeyRing {
	private readonly _accountKey: ED25519PrivateKey;
	// TODO: this can be removed as a property soon
	private readonly _mainIdentityKey: ED25519ExtendedPrivateKey;
	private readonly _rootEncryptionKey: ED25519ExtendedPrivateKey;
	constructor(accountKey: ED25519PrivateKey) {
		this._accountKey = accountKey;
		this._mainIdentityKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(accountKey),
			DERIVATION_PATH_IDENTITY_KEY_ROOT,
		);
		this._rootEncryptionKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(accountKey),
			DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
		);
	}
	static async Generate(): Promise<KeyRing> {
		// TODO: tempory for testing
		return new this(await ED25519PrivateKey.Generate());
	}

	static FromMnemonic(mnemonic: string, password?: string): KeyRing {
		return new this(ED25519PrivateKey.FromMnemonicPhrase(mnemonic, password));
	}

	static FromPrivateKey(key: ED25519PrivateKey): KeyRing {
		return new this(key);
	}

	createIdentityKeyForPublicKey(key: IPublicKey): ED25519PrivateKey {
		return AsED25519PrivateKey(DeriveHardenedKey(this._mainIdentityKey, key.Bytes).PrivateKey);
	}

	createIdentityKeyForAddress(
		address: Uint8Array,
		protocol: string,
		network: string,
		version = 1,
	): ED25519PrivateKey {
		return AsED25519PrivateKey(
			DeriveHardenedKey(this._mainIdentityKey, `${protocol}.${network}.${EncodeHexZeroX(address)} v${version}`)
				.PrivateKey,
		);
	}

	rootIdentityPublicKey(): IPublicKey {
		return AsED25519PublicKey(this._mainIdentityKey.PrivateKey.PublicKey);
	}

	rootEncryptionPublicKey(): IPublicKey {
		return AsED25519PublicKey(this._rootEncryptionKey.PrivateKey.PublicKey);
	}

	EncodedAddress(): string {
		if (this._mainIdentityKey) {
			return EncodeBase58(this._mainIdentityKey.PrivateKey.PublicKey.Bytes);
		}
		return '';
	}

	async SignWithIdentityKey(payload: string): Promise<Uint8Array> {
		return this._mainIdentityKey.PrivateKey.Sign(Buffer.from(payload, 'utf8'));
	}
}
