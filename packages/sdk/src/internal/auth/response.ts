import { PrivateKey } from '@mailchain/crypto';

export interface AuthenticatedResponse {
	clientSecretKey: Uint8Array;
	localStorageSessionKey: Uint8Array;
	rootAccountKey: PrivateKey;
}
