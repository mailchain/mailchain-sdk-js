import { ProtocolType } from '@mailchain/addressing';
import { ContractCall, GetMsgKeyResponseBody, getAddressFromApiResponse, ApiKeyConvert } from '@mailchain/api';
import { PublicKey } from '@mailchain/crypto';
import { KindRawED25519, KindEthereumPersonalMessage, KindTezos } from '@mailchain/signatures';
import { decodeHexZeroX } from '@mailchain/encoding';

export function messagingKeyProofFromApi(response: GetMsgKeyResponseBody): MailchainRegistryMessagingKeyProof {
	return {
		source: 'MailchainRegistry',
		address: getAddressFromApiResponse(response.proof.address),
		identityKey: ApiKeyConvert.public(response.proof.identityKey),
		locale: response.proof.locale,
		messageVariant: response.proof.variant,
		messagingKey: ApiKeyConvert.public(response.messagingKey),
		network: response.proof.address.network,
		nonce: response.proof.nonce,
		protocol: response.proof.address.protocol as ProtocolType,
		signature: decodeHexZeroX(response.proof.signature),
		signatureMethod: response.proof.signingMethod as
			| typeof KindEthereumPersonalMessage
			| typeof KindTezos
			| typeof KindRawED25519,
	};
}

export type MailchainRegistryMessagingKeyProof = {
	source: 'MailchainRegistry';
	identityKey: PublicKey;
	address: Uint8Array;
	protocol: ProtocolType;
	network: string;
	locale: string;
	messageVariant: string;
	nonce: number;
	signature: Uint8Array;
	signatureMethod: typeof KindEthereumPersonalMessage | typeof KindTezos | typeof KindRawED25519;
	messagingKey: PublicKey;
};

export type ContractCallProof = {
	source: 'ContractCall';
	call: ContractCall;
};

export type Proof = ContractCallProof | MailchainRegistryMessagingKeyProof;
