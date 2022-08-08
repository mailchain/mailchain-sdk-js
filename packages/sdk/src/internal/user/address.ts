import { protocols } from '@mailchain/internal';

export type Address = {
	id: string;
	address: string;
	nonce: number;
	protocol: protocols.ProtocolType;
	network: string;
};
