import { ContractCall, GetIdentityKeyNonceResponseBody, GetMsgKeyResponseBody } from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { MessagingKeyVerificationError } from '@mailchain/signatures';
import { Configuration } from '../../configuration';
import { MessagingKeyVerifier } from '../verify';
import { ContractCallLatestNonce, ContractCallMessagingKeyResolver, ContractCallResolveResult } from './resolver';
import { MessagingKeyNotFoundInContractError } from './errors';

export class MailchainKeyRegContractCallResolver implements ContractCallMessagingKeyResolver, ContractCallLatestNonce {
	constructor(
		private readonly messagingKeyVerifier: MessagingKeyVerifier,
		private readonly rpcEndpoint: string,
		private readonly axiosInstance: AxiosInstance,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new this(MessagingKeyVerifier.create(configuration), configuration.apiPath, axiosInstance);
	}

	async resolve(contract: ContractCall): Promise<ContractCallResolveResult> {
		if (contract.path === '/identity-keys/0/messaging-key') {
			return { error: new MessagingKeyNotFoundInContractError() };
		}

		const rpcResponse = await this.callGetMessagingKeyContract(contract);

		const messagingKey = convertPublic(rpcResponse.messagingKey);
		const verified = await this.messagingKeyVerifier.verifyRegisteredKeyProof(rpcResponse.proof, messagingKey);
		if (!verified) {
			return { error: new MessagingKeyVerificationError() };
		}

		return {
			data: {
				messagingKey,
				protocol: contract.protocol as any,
			},
		};
	}

	async latestNonce(contract: ContractCall): Promise<number> {
		if (contract.path === '/identity-keys/0/nonce') {
			throw new MessagingKeyNotFoundInContractError();
		}

		try {
			const { data } = await this.axiosInstance.request<GetIdentityKeyNonceResponseBody>({
				method: contract.method,
				url: this.rpcEndpoint + contract.path,
			});

			const { nonce } = data;

			return nonce;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
				throw new MessagingKeyNotFoundInContractError();
			}
			throw error;
		}
	}

	private async callGetMessagingKeyContract(contract: ContractCall): Promise<GetMsgKeyResponseBody> {
		const response = await this.axiosInstance.request<GetMsgKeyResponseBody>({
			method: contract.method,
			url: this.rpcEndpoint + contract.path,
		});

		if (response.status !== 200) {
			throw new Error(
				`Failed to get messaging key from near, status: ${response.status}, response: ${response.data}`,
			);
		}

		return response.data;
	}
}