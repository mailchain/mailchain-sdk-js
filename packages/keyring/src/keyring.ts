import { ED25519PrivateKey, deriveHardenedKey, ED25519ExtendedPrivateKey } from '@mailchain/crypto/ed25519';
import {
	PublicKey,
	PrivateKey,
	Encrypter,
	Decrypter,
	ED25519KeyExchange,
	PrivateKeyDecrypter,
	SignerWithPublicKey,
	PrivateKeyEncrypter,
} from '@mailchain/crypto';
import { encodeHex, encodeHexZeroX } from '@mailchain/encoding';
import { protocols } from '@mailchain/internal';
import { MAILCHAIN } from '@mailchain/internal/protocols';
import {
	DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
	DERIVATION_PATH_IDENTITY_KEY_ROOT,
	DERIVATION_PATH_INBOX_ROOT,
	DERIVATION_PATH_USER_PROFILE,
	DERIVATION_PATH_MESSAGING_KEY_ROOT,
	DERIVATION_PATH_DATE_OFFSET,
} from './constants';
import { ecdhKeyRingDecrypter, InboxKey, KeyRingDecrypter } from './functions';

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
		this._accountIdentityKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(accountKey),
			DERIVATION_PATH_IDENTITY_KEY_ROOT,
		);

		// used to derive all messaging keys
		const rootMessagingKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(accountKey),
			DERIVATION_PATH_MESSAGING_KEY_ROOT,
		);

		this._protocolAddressRootMessagingKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(rootMessagingKey.privateKey),
			1,
		);

		// e.g. bob@mailchain
		const rootAccountMessagingKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(rootMessagingKey.privateKey),
			'protocol=mailchain',
		);

		// default to nonce of 1 for now
		this._accountMessagingKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(rootAccountMessagingKey.privateKey),
			1,
		);

		this._rootEncryptionKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(accountKey),
			DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
		);
		this._userProfileEncryptionKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(this._rootEncryptionKey.privateKey),
			DERIVATION_PATH_USER_PROFILE,
		);
		this._rootInboxKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(this._rootEncryptionKey.privateKey),
			DERIVATION_PATH_INBOX_ROOT,
		);
	}

	static fromMnemonic(mnemonic: string, password?: string): KeyRing {
		return new this(ED25519PrivateKey.fromMnemonicPhrase(mnemonic, password));
	}

	static fromPrivateKey(key: ED25519PrivateKey): KeyRing {
		return new this(key);
	}

	rootEncryptionPublicKey(): PublicKey {
		return this._rootEncryptionKey.privateKey.publicKey;
	}

	rootInboxKey(): PrivateKey {
		return this._rootInboxKey.privateKey;
	}

	inboxMessageDateOffset(): number {
		const year2000 = 946684800;
		const offsetKey = deriveHardenedKey(
			ED25519ExtendedPrivateKey.fromPrivateKey(this._rootInboxKey.privateKey),
			DERIVATION_PATH_DATE_OFFSET,
		);

		const offset = Number(BigInt(encodeHexZeroX(offsetKey.bytes)) % BigInt(year2000));

		return offset;
	}

	inboxKey(): InboxKey {
		const inboxKey = this._rootInboxKey.privateKey;
		const decrypter = PrivateKeyDecrypter.fromPrivateKey(inboxKey);
		const encrypter = PrivateKeyEncrypter.fromPrivateKey(inboxKey);

		return { encrypt: (input) => encrypter.encrypt(input), decrypt: (input) => decrypter.decrypt(input) };
	}

	userProfileCrypto(): Encrypter & Decrypter {
		const inboxKey = this._userProfileEncryptionKey.privateKey;
		const decrypter = PrivateKeyDecrypter.fromPrivateKey(inboxKey);
		const encrypter = PrivateKeyEncrypter.fromPrivateKey(inboxKey);

		return { encrypt: (input) => encrypter.encrypt(input), decrypt: (input) => decrypter.decrypt(input) };
	}

	addressMessagingKey(address: Uint8Array, protocol: protocols.ProtocolType, nonce: number): KeyRingDecrypter {
		if (protocol === MAILCHAIN) {
			return this.accountMessagingKey();
		}
		// all addresses are encoded with hex regardless of protocol to ensure consistency
		const addressKeyRoot = deriveHardenedKey(
			this._protocolAddressRootMessagingKey,
			`protocol=${protocol},address=${encodeHex(address)}`,
		);

		// specific for the nonce
		const addressKey = deriveHardenedKey(addressKeyRoot, nonce).privateKey;
		return ecdhKeyRingDecrypter(addressKey);
	}

	accountMessagingKey(): KeyRingDecrypter {
		const key = this._accountMessagingKey.privateKey;
		const keyEx = new ED25519KeyExchange();

		return {
			curve: key.curve,
			sign: (input) => key.sign(input),
			publicKey: key.publicKey,
			ecdhDecrypt: async (bundleEphemeralKey: PublicKey, input: Uint8Array) => {
				const sharedSecret = await keyEx.SharedSecret(key, bundleEphemeralKey);
				const decrypter = PrivateKeyDecrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sharedSecret));

				return decrypter.decrypt(input);
			},
		};
	}

	accountIdentityKey(): SignerWithPublicKey {
		const key = this._accountIdentityKey.privateKey;
		return {
			curve: key.curve,
			sign: (input) => key.sign(input),
			publicKey: key.publicKey,
		};
	}
}
