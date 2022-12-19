import { ED25519PrivateKey, PrivateKeyDecrypter, PrivateKeyEncrypter, secureRandom } from '@mailchain/crypto';
import { fromEntropy, generate, toEntropy } from '@mailchain/crypto/mnemonic/mnemonic';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedAccountSecretEncryptionKindEnum, EncryptedAccountSecretSecretKindEnum } from '../api';
import { createRootAccountKey, decryptAccountSecret, encryptAccountSecret } from './accountSecretCrypto';

describe('createRootAccountKey', () => {
	it('create key from mnemonic phrase', () => {
		const mnemonicPhrase = generate();

		const key = createRootAccountKey({ kind: 'mnemonic-phrase', value: toEntropy(mnemonicPhrase) });

		expect(key).toEqual(ED25519PrivateKey.fromMnemonicPhrase(mnemonicPhrase));
	});

	it('create key from seed', () => {
		const seed = secureRandom(32);

		const key = createRootAccountKey({ kind: 'key-seed', value: seed });

		expect(key).toEqual(ED25519PrivateKey.fromSeed(seed));
	});
});

describe('decryptAccountSecret', () => {
	const clientSecretKey = secureRandom(32);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sha256(clientSecretKey)));

	it('should decrypt the account secret based on mnemonic phrase', async () => {
		const mnemonicPhrase = generate();
		const encryptedMnemonicPhrase = await encrypter.encrypt(toEntropy(mnemonicPhrase));

		const rootAccountKey = await decryptAccountSecret(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			secretKind: EncryptedAccountSecretSecretKindEnum.Mnemonic,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(rootAccountKey).toEqual({ kind: 'mnemonic-phrase', value: toEntropy(mnemonicPhrase) });
	});

	it('should decrypt the account secret based on key seed', async () => {
		const seed = secureRandom(32);
		const encryptedMnemonicPhrase = await encrypter.encrypt(seed);

		const accountSecret = await decryptAccountSecret(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			secretKind: EncryptedAccountSecretSecretKindEnum.Account,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(accountSecret).toEqual({ kind: 'key-seed', value: seed });
	});
});

describe('encryptAccountSecret', () => {
	const clientSecretKey = secureRandom(32);
	const decrypter = PrivateKeyDecrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sha256(clientSecretKey)));

	it('should encrypt the account secret based on mnemonic phrase', async () => {
		const mnemonicPhrase = generate();

		const encryptedAccountSecret = await encryptAccountSecret(clientSecretKey, {
			kind: 'mnemonic-phrase',
			value: toEntropy(mnemonicPhrase),
		});

		expect(encryptedAccountSecret.secretKind).toEqual(EncryptedAccountSecretSecretKindEnum.Mnemonic);
		expect(
			fromEntropy(await decrypter.decrypt(decodeBase64(encryptedAccountSecret.encryptedAccountSecret))),
		).toEqual(mnemonicPhrase);
	});

	it('should encrypt the account secret based on key seed', async () => {
		const seed = secureRandom(32);

		const encryptedAccountSecret = await encryptAccountSecret(clientSecretKey, {
			kind: 'key-seed',
			value: seed,
		});

		expect(encryptedAccountSecret.secretKind).toEqual(EncryptedAccountSecretSecretKindEnum.Account);
		expect(await decrypter.decrypt(decodeBase64(encryptedAccountSecret.encryptedAccountSecret))).toEqual(seed);
	});
});
