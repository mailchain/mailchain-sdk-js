import { ETHEREUM, NEAR, ProtocolType } from '@mailchain/addressing';
import axios, { AxiosInstance } from 'axios';
import { MessagingKeysApiFactory, MessagingKeysApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../mailchain';
import { ContractCallLatestNonce } from './contractResolvers/resolver';
import { NearContractCallResolver } from './contractResolvers/near';
import { MailchainKeyRegContractCallResolver } from './contractResolvers/mailchain';

export class MessagingKeyNonces {
	constructor(
		private readonly messagingKeysApi: MessagingKeysApiInterface,
		private readonly resolvers: Map<ProtocolType, ContractCallLatestNonce>,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new MessagingKeyNonces(
			MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			new Map<ProtocolType, ContractCallLatestNonce>([
				[NEAR, NearContractCallResolver.create(configuration, axiosInstance)],
				[ETHEREUM, MailchainKeyRegContractCallResolver.create(configuration, axiosInstance)],
			]),
		);
	}

	async getAddressNonce(address: string, protocol: ProtocolType) {
		const resolver = this.resolvers.get(protocol);
		if (!resolver) {
			throw new Error(`No resolver for protocol ${protocol}`);
		}
		if (protocol !== ETHEREUM && protocol !== NEAR) {
			throw new Error(`Protocol ${protocol} not supported by API`);
		}

		const nonceContractResponse = await this.messagingKeysApi.getProtocolAddressNonce(address, protocol);

		const contractResponse = await resolver.latestNonce(nonceContractResponse.data.contractCall);

		switch (contractResponse.status) {
			case 'ok':
				return contractResponse.nonce;
			case 'not-found':
				return 0;
			case 'error':
				throw contractResponse.cause;
			default:
				throw new Error(`unknown contract contract response status of [${contractResponse['status']}]`);
		}
	}
}
