import { EncryptedContent, PlainContent, PublicKey } from '@mailchain/crypto';
import { KeyRing } from './keyring';

export interface KeyRingDecrypter extends KeyRingSigner {
	ecdhDecrypt(bundleEphemeralKey: PublicKey, input: EncryptedContent): Promise<PlainContent>;
}

export interface KeyRingSigner {
	sign(message: Uint8Array): Promise<Uint8Array>;
	publicKey: PublicKey;
}
