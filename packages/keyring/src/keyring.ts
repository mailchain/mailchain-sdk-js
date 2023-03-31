import {
	PublicKey,
	PrivateKey,
	Encrypter,
	Decrypter,
	ED25519KeyExchange,
	PrivateKeyDecrypter,
	SignerWithPublicKey,
	PrivateKeyEncrypter,
	ED25519PrivateKey,
	deriveHardenedKey,
	ED25519ExtendedPrivateKey,
} from '@mailchain/crypto';
import { encodeHex, encodeHexZeroX } from '@mailchain/encoding';
import { decodeAddressByProtocol, MAILCHAIN, ProtocolType } from '@mailchain/addressing';
import {
	DERIVATION_PATH_ENCRYPTION_KEY_ROOT,
	DERIVATION_PATH_IDENTITY_KEY_ROOT,
	DERIVATION_PATH_INBOX_ROOT,
	DERIVATION_PATH_USER_PROFILE,
	DERIVATION_PATH_MESSAGING_KEY_ROOT,
	DERIVATION_PATH_DATE_OFFSET,
} from './constants';
import { ecdhKeyRingDecrypter, InboxKey, KeyRingDecrypter } from './functions';

export type PrivateMessagingKey = KeyRingDecrypter;

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

	/**
	 * Use your Secret Recovery Phrase to authenticate your keyring.
	 * @param secretRecoveryPhrase a 24 word [BIP 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) compatible mnemonic phrase.
	 */
	static fromSecretRecoveryPhrase(secretRecoveryPhrase: string, password?: string): KeyRing {
		return new this(ED25519PrivateKey.fromMnemonicPhrase(secretRecoveryPhrase, password));
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

	/**
	 * Gets messaging key that can be used for signing and decrypting for a specific protocol address.
	 * @param address protocol address e.g. 0x1234.... for ethereum
	 * @param protocol a {@link ProtocolType}
	 * @param nonce in most cases you will want to use the latest nonce.
	 * @returns
	 */
	addressMessagingKey(address: string, protocol: ProtocolType, nonce: number): PrivateMessagingKey {
		const decodedAddress = decodeAddressByProtocol(address, protocol).decoded;
		return this.addressBytesMessagingKey(decodedAddress, protocol, nonce);
	}

	/**
	 * Gets messaging key that can be exported for a specific protocol address.
	 * @param address protocol address e.g. 0x1234.... for ethereum
	 * @param protocol a {@link ProtocolType}
	 * @param nonce in most cases you will want to use the latest nonce.
	 * @returns
	 */
	addressExportableMessagingKey(address: string, protocol: ProtocolType, nonce: number): PrivateKey {
		const decodedAddress = decodeAddressByProtocol(address, protocol).decoded;
		return this.addressBytesExportableMessagingKey(decodedAddress, protocol, nonce);
	}

	addressBytesMessagingKey(address: Uint8Array, protocol: ProtocolType, nonce: number): PrivateMessagingKey {
		// specific for the nonce
		const addressKey = this.addressBytesExportableMessagingKey(address, protocol, nonce);
		return ecdhKeyRingDecrypter(addressKey);
	}

	addressBytesExportableMessagingKey(address: Uint8Array, protocol: ProtocolType, nonce: number): PrivateKey {
		if (protocol === MAILCHAIN) {
			return this.accountExportableMessagingKey();
		}
		// all addresses are encoded with hex regardless of protocol to ensure consistency
		const addressKeyRoot = deriveHardenedKey(
			this._protocolAddressRootMessagingKey,
			`protocol=${protocol},address=${encodeHex(address)}`,
		);

		// specific for the nonce
		return deriveHardenedKey(addressKeyRoot, nonce).privateKey;
	}

	accountExportableMessagingKey(): PrivateKey {
		return this._accountMessagingKey.privateKey;
	}

	accountMessagingKey(): PrivateMessagingKey {
		const key = this.accountExportableMessagingKey();

		return ecdhKeyRingDecrypter(key);
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
