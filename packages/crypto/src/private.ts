import { PublicKey } from './public';

export interface PrivateKey {
	readonly Bytes: Uint8Array;
	readonly PublicKey: PublicKey;
	Sign: (message: Uint8Array) => Promise<Uint8Array>;
}
