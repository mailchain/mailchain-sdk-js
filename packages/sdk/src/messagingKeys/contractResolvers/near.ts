import { encodeUtf8, decodeBase64, decodeHex } from '@mailchain/encoding';
import { publicKeyFromKind } from '@mailchain/crypto';
import { ContractCall } from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { NEAR } from '@mailchain/addressing';
import { Configuration } from '../../mailchain';
import {
	ContractCallLatestNonce,
	ContractCallMessagingKeyResolver,
	ContractLatestNonceResponse,
	ContractMessagingKeyResponse,
} from './resolver';

type NearRPCResponseResult = {
	block_hash: string;
	block_height: number;
	logs: any[];
	result: any[];
	error?: NearRPCResponseError;
};

type NearRPCResponseError = {
	cause: {
		info: any;
		name: string;
	};
	code: number;
	data: string;
	message: string;
	name: string;
};

type NearRPCResponse = {
	jsonrpc: '2.0';
	id: string;
	result: NearRPCResponseResult;
};

export class NearContractCallResolver implements ContractCallMessagingKeyResolver, ContractCallLatestNonce {
	constructor(private readonly rpcEndpoint: string, private readonly axiosInstance: AxiosInstance) {}

	static create(config: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new NearContractCallResolver(config.nearRpcUrl, axiosInstance);
	}

	async resolve(contract: ContractCall): Promise<ContractMessagingKeyResponse> {
		let rpcResponse: NearRPCResponseResult;
		try {
			rpcResponse = await this.callContract(contract);
		} catch (error) {
			return {
				status: 'failed-to-call-contract',
				cause: error as Error,
			};
		}

		const result = encodeUtf8(Uint8Array.from(rpcResponse.result));

		if (result === 'null') {
			return {
				status: 'not-found',
			};
		}

		try {
			const parsedResult = parseMessagingKeyContractResult(result);

			return {
				status: 'ok',
				messagingKey: parsedResult.messagingKey,
				protocol: NEAR,
			};
		} catch (error) {
			return {
				status: 'invalid-key',
				cause: error as Error,
			};
		}
	}

	async latestNonce(contract: ContractCall): Promise<ContractLatestNonceResponse> {
		const rpcResponse = await this.callContract(contract);

		const result = encodeUtf8(Uint8Array.from(rpcResponse.result));

		if (result === 'null') {
			return {
				status: 'not-found',
			};
		}

		try {
			return {
				status: 'ok',
				nonce: parseInt(result, 10),
			};
		} catch (error) {
			return {
				status: 'error',
				cause: error as Error,
			};
		}
	}

	private async callContract(contract: ContractCall): Promise<NearRPCResponseResult> {
		if (contract.body.length === 0) {
			throw new Error('No body on contract call');
		}

		const body = encodeUtf8(decodeBase64(contract.body));
		const postData = JSON.parse(body);

		const response = await this.axiosInstance.request<NearRPCResponse>({
			method: contract.method,
			url: this.rpcEndpoint,
			data: postData,
		});

		if (response.status !== 200) {
			throw new Error(
				`Failed to get messaging key from near, status: ${response.status}, response: ${response.data}`,
			);
		}

		const { data } = response;

		if (data.result.error != null) {
			throw new Error(`Contract error; error=${data.result.error}`);
		}

		if (!data.result.result) {
			throw new Error(`No error but missing result response: ${data}`);
		}

		return data.result;
	}
}

function parseMessagingKeyContractResult(result: string) {
	const parsedResult = JSON.parse(result);
	if (typeof parsedResult !== 'object') {
		throw new Error('Invalid result from contract');
	}

	const [curve, messageKey] = parsedResult as [string, string];
	if (curve == null || messageKey == null) {
		throw new Error('Invalid result length from contract');
	}

	if (typeof curve !== 'string') {
		throw new Error('Invalid curve format from contract');
	}

	if (typeof messageKey !== 'string') {
		throw new Error('Invalid key format from contract');
	}

	return { messagingKey: publicKeyFromKind(curve, decodeHex(messageKey)) };
}
