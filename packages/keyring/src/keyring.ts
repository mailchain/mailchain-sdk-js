import {
	ED25519PrivateKey,
	DeriveHardenedKey,
	ED25519ExtendedPrivateKey,
	AsED25519PublicKey,
	AsED25519PrivateKey,
} from '@mailchain/crypto/ed25519';
import { EncodeBase58 } from '@mailchain/encoding/base58';
import { PublicKey, PrivateKey, Encrypter, Decrypter, PublicKeyEncrypter, PublicKeyDecrypter } from '@mailchain/crypto';
import { EncodeHex } from '@mailchain/encoding';
import { protocols } from '@mailchain/internal';
import {
	DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
	DERIVATION_PATH_IDENTITY_KEY_ROOT,
	DERIVATION_PATH_INBOX_ROOT,
	DERIVATION_PATH_USER_PROFILE,
	DERIVATION_PATH_MESSAGING_KEY_ROOT,
} from './constants';

export class KeyRing {
	private readonly _accountIdentityKey: ED25519ExtendedPrivateKey;
	private readonly _rootEncryptionKey: ED25519ExtendedPrivateKey;
	private readonly _userProfileEncryptionKey: ED25519ExtendedPrivateKey;
	private readonly _rootInboxKey: ED25519ExtendedPrivateKey;
	// used to derive messaging keys for all protocol addresses
	private readonly _protocolAddressRootMessagingKey: ED25519ExtendedPrivateKey;
	private readonly _accountMessagingKey: ED25519ExtendedPrivateKey;
	/**
	 *
	 * @param accountKey This key is never stored in the key chain only used to derive other keys.
	 */
	constructor(accountKey: ED25519PrivateKey) {
		this._accountIdentityKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(accountKey),
			DERIVATION_PATH_IDENTITY_KEY_ROOT,
		);

		// used to derive all messaging keys
		const rootMessagingKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(accountKey),
			DERIVATION_PATH_MESSAGING_KEY_ROOT,
		);

		this._protocolAddressRootMessagingKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(rootMessagingKey.PrivateKey),
			1,
		);

		// e.g. bob@mailchain
		const rootAccountMessagingKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(rootMessagingKey.PrivateKey),
			'protocol=mailchain',
		);

		// default to nonce of 1 for now
		this._accountMessagingKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(rootAccountMessagingKey.PrivateKey),
			1,
		);

		this._rootEncryptionKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(accountKey),
			DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
		);
		this._userProfileEncryptionKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(this._rootEncryptionKey.PrivateKey),
			DERIVATION_PATH_USER_PROFILE,
		);
		this._rootInboxKey = DeriveHardenedKey(
			ED25519ExtendedPrivateKey.FromPrivateKey(this._rootEncryptionKey.PrivateKey),
			DERIVATION_PATH_INBOX_ROOT,
		);
	}
	static async Generate(): Promise<KeyRing> {
		// TODO: temporary for testing
		return new this(await ED25519PrivateKey.Generate());
	}

	static FromMnemonic(mnemonic: string, password?: string): KeyRing {
		return new this(ED25519PrivateKey.FromMnemonicPhrase(mnemonic, password));
	}

	static FromPrivateKey(key: ED25519PrivateKey): KeyRing {
		return new this(key);
	}

	createIdentityKeyForPublicKey(key: PublicKey): ED25519PrivateKey {
		return AsED25519PrivateKey(DeriveHardenedKey(this._accountIdentityKey, key.Bytes).PrivateKey);
	}

	createMessagingKeyForAddress(
		address: Uint8Array,
		protocol: protocols.ProtocolType,
		nonce: number,
	): ED25519PrivateKey {
		// all addresses are encoded with hex regardless of protocol to ensure consistency
		const addressKeyRoot = DeriveHardenedKey(
			this._protocolAddressRootMessagingKey,
			`protocol=${protocol},address=${EncodeHex(address)}`,
		);

		// specific for the nonce
		return DeriveHardenedKey(addressKeyRoot, nonce).PrivateKey;
	}

	rootIdentityPublicKey(): PublicKey {
		return AsED25519PublicKey(this._accountIdentityKey.PrivateKey.PublicKey);
	}

	rootEncryptionPublicKey(): PublicKey {
		return AsED25519PublicKey(this._rootEncryptionKey.PrivateKey.PublicKey);
	}

	accountMessagingPublicKey(): PublicKey {
		return AsED25519PublicKey(this._accountMessagingKey.PrivateKey.PublicKey);
	}

	rootInboxKey(): PrivateKey {
		return this._rootInboxKey.PrivateKey;
	}

	EncodedAddress(): string {
		if (this._accountIdentityKey) {
			return EncodeBase58(this._accountIdentityKey.PrivateKey.PublicKey.Bytes);
		}
		return '';
	}

	userProfileCrypto(): {
		encrypter: Encrypter['Encrypt'];
		decrypter: Decrypter['Decrypt'];
	} {
		return {
			encrypter: (input) =>
				PublicKeyEncrypter.FromPublicKey(this._userProfileEncryptionKey.PrivateKey.PublicKey).Encrypt(input),
			decrypter: (input) =>
				PublicKeyDecrypter.FromPrivateKey(this._userProfileEncryptionKey.PrivateKey).Decrypt(input),
		};
	}

	async SignWithIdentityKey(payload: string): Promise<Uint8Array> {
		return this._accountIdentityKey.PrivateKey.Sign(Buffer.from(payload, 'utf8'));
	}

	async SignWithMessageKey(payload: string): Promise<Uint8Array> {
		return this._accountMessagingKey.PrivateKey.Sign(Buffer.from(payload, 'utf8'));
	}
}
