import { PublicKey } from './public';

export interface PrivateKey extends SignerWithPublicKey {
	readonly bytes: Uint8Array;
}

export interface SignerWithPublicKey extends Signer {
	readonly publicKey: PublicKey;
}

export interface Signer {
	sign(message: Uint8Array): Promise<Uint8Array>;
	curve: string;
}
