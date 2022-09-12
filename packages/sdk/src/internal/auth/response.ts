import { PrivateKey } from '@mailchain/crypto';

export interface AuthenticatedResponse {
	clientSecretKey: Uint8Array;
	rootAccountKey: PrivateKey;
	accountSecret: { kind: 'key-seed' | 'mnemonic-phrase'; value: Uint8Array };
}
