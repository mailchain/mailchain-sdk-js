import { PrivateKey, PublicKey } from '..';

export interface KeyExchange {
	EphemeralKey: () => Promise<PrivateKey>;

	SharedSecret: (privateKey: PrivateKey, publicKey: PublicKey) => Promise<Uint8Array>;
}
