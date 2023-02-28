import { ContractCall, GetIdentityKeyNonceResponseBody, GetMsgKeyResponseBody } from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { Configuration } from '../../mailchain';
import { MessagingKeyVerifier } from '../verify';
import {
	ContractCallLatestNonce,
	ContractCallMessagingKeyResolver,
	ContractLatestNonceResponse,
	ContractMessagingKeyResponse,
} from './resolver';

export class MailchainKeyRegContractCallResolver implements ContractCallMessagingKeyResolver, ContractCallLatestNonce {
	constructor(
		private readonly messagingKeyVerifier: MessagingKeyVerifier,
		private readonly rpcEndpoint: string,
		private readonly axiosInstance: AxiosInstance,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new this(MessagingKeyVerifier.create(configuration), configuration.apiPath, axiosInstance);
	}

	async resolve(contract: ContractCall): Promise<ContractMessagingKeyResponse> {
		if (contract.path === '/identity-keys/0/messaging-key') {
			return {
				status: 'not-found',
			};
		}

		const rpcResponse = await this.callGetMessagingKeyContract(contract);

		const messagingKey = convertPublic(rpcResponse.messagingKey);
		const verified = await this.messagingKeyVerifier.verifyRegisteredKeyProof(rpcResponse.proof, messagingKey);
		if (!verified) {
			return {
				status: 'proof-verification-failed',
			};
		}

		return {
			status: 'ok',
			messagingKey,
			protocol: contract.protocol as any,
		};
	}

	async latestNonce(contract: ContractCall): Promise<ContractLatestNonceResponse> {
		if (contract.path === '/identity-keys/0/nonce') {
			return {
				status: 'not-found',
			};
		}

		try {
			const { data } = await this.axiosInstance.request<GetIdentityKeyNonceResponseBody>({
				method: contract.method,
				url: this.rpcEndpoint + contract.path,
			});

			const { nonce } = data;

			return {
				status: 'ok',
				nonce,
			};
		} catch (error) {
			if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
				return {
					status: 'not-found',
				};
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
