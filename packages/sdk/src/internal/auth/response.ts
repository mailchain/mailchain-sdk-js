import { PrivateKey } from '@mailchain/crypto';

export interface AuthenticatedResponse {
	clientSecretKey: Uint8Array;
	rootAccountKey: PrivateKey;
}
