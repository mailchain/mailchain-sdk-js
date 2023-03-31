import { encodeUtf8, decodeBase64, decodeHex } from '@mailchain/encoding';
import { publicKeyFromKind } from '@mailchain/crypto';
import { ContractCall } from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { NEAR } from '@mailchain/addressing';
import { Configuration } from '../../configuration';
import { ContractCallLatestNonce, ContractCallMessagingKeyResolver, ContractCallResolveResult } from './resolver';
import { InvalidContractResponseError, MessagingKeyNotFoundInContractError } from './errors';

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

	async resolve(contract: ContractCall): Promise<ContractCallResolveResult> {
		const rpcResponse = await this.callContract(contract);

		const result = encodeUtf8(Uint8Array.from(rpcResponse.result));

		if (result === 'null') {
			return { error: new MessagingKeyNotFoundInContractError() };
		}

		const parsedResult = parseMessagingKeyContractResult(result);
		if (parsedResult.error != null) {
			return parsedResult;
		}

		return {
			data: {
				messagingKey: parsedResult.data.messagingKey,
				protocol: NEAR,
			},
		};
	}

	async latestNonce(contract: ContractCall): Promise<number> {
		const rpcResponse = await this.callContract(contract);

		const result = encodeUtf8(Uint8Array.from(rpcResponse.result));

		if (result === 'null') {
			throw new MessagingKeyNotFoundInContractError();
		}

		return parseInt(result, 10);
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
		return { error: new InvalidContractResponseError('Object expected.') };
	}

	const [curve, messageKey] = parsedResult as [string, string];
	if (curve == null || messageKey == null) {
		return { error: new InvalidContractResponseError('Result does not have correct number of elements.') };
	}

	if (typeof curve !== 'string') {
		return { error: new InvalidContractResponseError('Curve format must be string.') };
	}

	if (typeof messageKey !== 'string') {
		return { error: new InvalidContractResponseError('Message key format must be string.') };
	}

	return { data: { messagingKey: publicKeyFromKind(curve, decodeHex(messageKey)) } };
}
