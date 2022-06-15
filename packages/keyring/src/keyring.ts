import {
	ED25519PrivateKey,
	DeriveHardenedKey,
	ED25519ExtendedPrivateKey,
	ED25519PublicKey,
} from '@mailchain/crypto/ed25519';
import {
	PublicKey,
	PrivateKey,
	Encrypter,
	Decrypter,
	PublicKeyEncrypter,
	PublicKeyDecrypter,
	ED25519KeyExchange,
	PrivateKeyDecrypter,
} from '@mailchain/crypto';
import { EncodeHex } from '@mailchain/encoding';
import { protocols } from '@mailchain/internal';
import {
	DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
	DERIVATION_PATH_IDENTITY_KEY_ROOT,
	DERIVATION_PATH_INBOX_ROOT,
	DERIVATION_PATH_USER_PROFILE,
	DERIVATION_PATH_MESSAGING_KEY_ROOT,
} from './constants';
import { KeyRingDecrypter, KeyRingSigner } from './address';

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

	static FromMnemonic(mnemonic: string, password?: string): KeyRing {
		return new this(ED25519PrivateKey.FromMnemonicPhrase(mnemonic, password));
	}

	static FromPrivateKey(key: ED25519PrivateKey): KeyRing {
		return new this(key);
	}

	createIdentityKeyForPublicKey(key: PublicKey): ED25519PrivateKey {
		return DeriveHardenedKey(this._accountIdentityKey, key.Bytes).PrivateKey;
	}

	createMessagingKeyForAddress(
		address: Uint8Array,
		protocol: protocols.ProtocolType,
		nonce: number,
	): ED25519PublicKey {
		// all addresses are encoded with hex regardless of protocol to ensure consistency
		const addressKeyRoot = DeriveHardenedKey(
			this._protocolAddressRootMessagingKey,
			`protocol=${protocol},address=${EncodeHex(address)}`,
		);

		// specific for the nonce
		return DeriveHardenedKey(addressKeyRoot, nonce).PrivateKey.PublicKey;
	}

	rootEncryptionPublicKey(): PublicKey {
		return this._rootEncryptionKey.PrivateKey.PublicKey;
	}

	rootInboxKey(): PrivateKey {
		return this._rootInboxKey.PrivateKey;
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

	accountMessagingKey = (): KeyRingDecrypter => {
		const key = this._accountMessagingKey.PrivateKey;
		const keyEx = new ED25519KeyExchange();

		return {
			sign: (input) => key.Sign(input),
			publicKey: key.PublicKey,
			ecdhDecrypt: async (bundleEphemeralKey: PublicKey, input: Uint8Array) => {
				const sharedSecret = await keyEx.SharedSecret(key, bundleEphemeralKey);
				const decrypter = PrivateKeyDecrypter.FromPrivateKey(ED25519PrivateKey.FromSeed(sharedSecret));

				return decrypter.Decrypt(input);
			},
		};
	};

	accountIdentityKey = (): KeyRingSigner => {
		const key = this._accountIdentityKey.PrivateKey;
		return {
			sign: (input) => key.Sign(input),
			publicKey: key.PublicKey,
		};
	};
}
