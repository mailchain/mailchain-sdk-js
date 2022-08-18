import { ProtocolType } from '@mailchain/addressing';

export type Address = {
	id: string;
	address: string;
	nonce: number;
	protocol: ProtocolType;
	network: string;
};
