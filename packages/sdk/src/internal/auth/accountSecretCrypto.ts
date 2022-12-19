import { ED25519PrivateKey, PrivateKeyDecrypter, PrivateKeyEncrypter } from '@mailchain/crypto';
import { fromEntropy } from '@mailchain/crypto/mnemonic/mnemonic';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedAccountSecret, EncryptedAccountSecretSecretKindEnum } from '../api';
import { AuthenticatedResponse } from './response';

export async function decryptAccountSecret(
	clientSecretKey: Uint8Array,
	encryptedAccountSecret: EncryptedAccountSecret,
): Promise<AuthenticatedResponse['accountSecret']> {
	const seed = sha256(clientSecretKey);
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const decrypter = PrivateKeyDecrypter.fromPrivateKey(encryptionKey);

	const decryptedSecret = await decrypter.decrypt(decodeBase64(encryptedAccountSecret.encryptedAccountSecret));

	switch (encryptedAccountSecret.secretKind) {
		case EncryptedAccountSecretSecretKindEnum.Account:
			return { kind: 'key-seed', value: decryptedSecret };
		case EncryptedAccountSecretSecretKindEnum.Mnemonic:
			return { kind: 'mnemonic-phrase', value: decryptedSecret };
		default:
			throw new Error(`unknown secretKind [${encryptedAccountSecret.secretKind}]`);
	}
}

export async function encryptAccountSecret(
	clientSecretKey: Uint8Array,
	accountSecret: AuthenticatedResponse['accountSecret'],
): Promise<Pick<EncryptedAccountSecret, 'secretKind' | 'encryptedAccountSecret'>> {
	const seed = sha256(clientSecretKey);
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(encryptionKey);

	const encryptedAccountSecret = encodeBase64(await encrypter.encrypt(accountSecret.value));

	switch (accountSecret.kind) {
		case 'key-seed':
			return {
				secretKind: EncryptedAccountSecretSecretKindEnum.Account,
				encryptedAccountSecret,
			};
		case 'mnemonic-phrase':
			return {
				secretKind: EncryptedAccountSecretSecretKindEnum.Mnemonic,
				encryptedAccountSecret,
			};
		default:
			throw new Error(`unknown secretKind [${accountSecret.kind}]`);
	}
}

export function createRootAccountKey({ kind, value }: AuthenticatedResponse['accountSecret']) {
	switch (kind) {
		case 'key-seed':
			return ED25519PrivateKey.fromSeed(value);
		case 'mnemonic-phrase':
			return ED25519PrivateKey.fromMnemonicPhrase(fromEntropy(value));
	}
}
