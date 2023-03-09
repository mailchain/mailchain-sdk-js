import { ProtocolType } from '@mailchain/addressing';
import { ContractCall } from '@mailchain/api';
import { PublicKey } from '@mailchain/crypto';
import { MailchainResult } from '../../mailchainResult';
import { InvalidContractResponseError, MessagingKeyNotFoundInContractError } from './errors';

export type ContractMessagingKey = {
	messagingKey: PublicKey;
	protocol: ProtocolType;
};
export type ContractMessagingKeyError = MessagingKeyNotFoundInContractError | InvalidContractResponseError;
export type ContractCallResolveResult = MailchainResult<
	ContractMessagingKey,
	MessagingKeyNotFoundInContractError | InvalidContractResponseError
>;

export interface ContractCallMessagingKeyResolver {
	resolve(contract: ContractCall): Promise<ContractCallResolveResult>;
}

export interface ContractCallLatestNonce {
	latestNonce(contract: ContractCall): Promise<number>;
}
