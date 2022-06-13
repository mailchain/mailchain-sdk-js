import { PublicKey } from '@mailchain/crypto';

export interface KeyFunctions {
	sign(message: Uint8Array): Promise<Uint8Array>;
	publicKey: PublicKey;
}
