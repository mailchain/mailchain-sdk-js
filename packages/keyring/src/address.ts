import { EncryptedContent, PlainContent, PublicKey, SignerWithPublicKey } from '@mailchain/crypto';

export interface KeyRingDecrypter extends SignerWithPublicKey {
	ecdhDecrypt(bundleEphemeralKey: PublicKey, input: EncryptedContent): Promise<PlainContent>;
}
