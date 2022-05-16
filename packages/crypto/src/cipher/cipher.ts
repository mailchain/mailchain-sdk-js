/**
 * NaCl with Elliptic Curve Diffie–Hellman key exchange
 */
export const NACLECDH = 0x2a;
/**
 * NaCl with a secret key
 */
export const NACLSK = 0x2b;

export const KindNaClSecretKey = 'nacl-secret-key';

export type EncryptedContent = Uint8Array;

export type PlainContent = Uint8Array;

export interface Decrypter {
	Decrypt: (input: EncryptedContent) => Promise<PlainContent>;
}

export interface Encrypter {
	Encrypt: (input: PlainContent) => Promise<EncryptedContent>;
}
