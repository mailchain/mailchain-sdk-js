import {
	Decrypter,
	ED25519KeyExchange,
	EncryptedContent,
	Encrypter,
	PlainContent,
	PrivateKey,
	PrivateKeyDecrypter,
	PublicKey,
	SignerWithPublicKey,
	ED25519PrivateKey,
} from '@mailchain/crypto';

export interface KeyRingDecrypter extends SignerWithPublicKey {
	ecdhDecrypt(bundleEphemeralKey: PublicKey, input: EncryptedContent): Promise<PlainContent>;
}

export type InboxKey = Encrypter & Decrypter;

export function ecdhKeyRingDecrypter(privateKey: PrivateKey): KeyRingDecrypter {
	return {
		curve: privateKey.curve,
		sign: (input) => privateKey.sign(input),
		publicKey: privateKey.publicKey,
		ecdhDecrypt: async (bundleEphemeralKey: PublicKey, input: Uint8Array) => {
			const keyEx = new ED25519KeyExchange();
			const sharedSecret = await keyEx.SharedSecret(privateKey, bundleEphemeralKey);
			const decrypter = PrivateKeyDecrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sharedSecret));

			return decrypter.decrypt(input);
		},
	};
}
