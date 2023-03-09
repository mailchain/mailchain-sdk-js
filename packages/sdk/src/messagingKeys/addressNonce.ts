import { ETHEREUM, NEAR, ProtocolType } from '@mailchain/addressing';
import axios, { AxiosInstance } from 'axios';
import { MessagingKeysApiFactory, MessagingKeysApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../configuration';
import { ContractCallLatestNonce } from './contractResolvers/resolver';
import { NearContractCallResolver } from './contractResolvers/near';
import { MailchainKeyRegContractCallResolver } from './contractResolvers/mailchain';
import { MessagingKeyNotFoundInContractError } from './contractResolvers/errors';

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

	async getAddressNonce(address: string, protocol: ProtocolType): Promise<number> {
		const resolver = this.resolvers.get(protocol);
		if (!resolver) {
			throw new Error(`No resolver for protocol ${protocol}`);
		}
		if (protocol !== ETHEREUM && protocol !== NEAR) {
			throw new Error(`Protocol ${protocol} not supported by API`);
		}

		const nonceContractResponse = await this.messagingKeysApi.getProtocolAddressNonce(address, protocol);

		try {
			return await resolver.latestNonce(nonceContractResponse.data.contractCall);
		} catch (error) {
			if (error instanceof MessagingKeyNotFoundInContractError) {
				return 0;
			}
			throw error;
		}
	}
}
