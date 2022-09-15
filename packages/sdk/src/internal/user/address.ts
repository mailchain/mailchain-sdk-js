import { ProtocolType } from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';

export type Address = {
	id: string;
	identityKey: PublicKey;
	address: string;
	nonce: number;
	protocol: ProtocolType;
	network: string;
};
