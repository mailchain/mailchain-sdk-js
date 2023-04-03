import { ProtocolType } from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';

export type MessagingKeyProof = {
	identityKey: PublicKey;
	address: Uint8Array;
	protocol: ProtocolType;
	network: string;
	locale: string;
	messageVariant: string;
	nonce: number;
	signature: Uint8Array;
	signatureMethod: 'ethereum_personal_message' | 'tezos_signed_message_micheline';
	messagingKey: PublicKey;
};
