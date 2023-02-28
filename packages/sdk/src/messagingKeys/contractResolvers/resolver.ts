import { ProtocolType } from '@mailchain/addressing';
import { ContractCall } from '@mailchain/api';
import { PublicKey } from '@mailchain/crypto';

type ContractMessagingKeyResponseNotFound = {
	status: 'not-found';
};

type ContractMessagingKeyResponseInvalidKey = {
	status: 'invalid-key';
	cause: Error;
};

type ContractMessagingKeyResponseFailedToCallContract = {
	status: 'failed-to-call-contract';
	cause: Error;
};

type ContractMessagingKeyResponseInvalidProof = {
	status: 'proof-verification-failed';
};

type ContractMessagingKeyResponseFound = {
	status: 'ok';
	messagingKey: PublicKey;
	protocol: ProtocolType;
};

type ContractLatestNonceResponseOk = {
	status: 'ok';
	nonce: number;
};

type ContractLatestNonceResponseNotFound = {
	status: 'not-found';
};

type ContractLatestNonceResponseError = {
	status: 'error';
	cause: Error;
};

export type ContractLatestNonceResponse =
	| ContractLatestNonceResponseOk
	| ContractLatestNonceResponseNotFound
	| ContractLatestNonceResponseError;

export type ContractMessagingKeyResponse =
	| ContractMessagingKeyResponseNotFound
	| ContractMessagingKeyResponseFound
	| ContractMessagingKeyResponseInvalidKey
	| ContractMessagingKeyResponseFailedToCallContract
	| ContractMessagingKeyResponseInvalidProof;

export interface ContractCallMessagingKeyResolver {
	resolve(contract: ContractCall): Promise<ContractMessagingKeyResponse>;
}

export interface ContractCallLatestNonce {
	latestNonce(contract: ContractCall): Promise<ContractLatestNonceResponse>;
}
