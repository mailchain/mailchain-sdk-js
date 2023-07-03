import {
	ETHEREUM,
	MAILCHAIN,
	NEAR,
	ProtocolNotSupportedError,
	ProtocolType,
	TEZOS,
	isBlockchainProtocolEnabled,
} from '@mailchain/addressing';
import axios, { AxiosInstance } from 'axios';
import { MessagingKeysApiFactory, MessagingKeysApiInterface, createAxiosConfiguration } from '@mailchain/api';
import { Configuration } from '../configuration';
import { MailchainResult } from '../mailchainResult';
import { ContractCallLatestNonce } from './contractResolvers/resolver';
import { NearContractCallResolver } from './contractResolvers/near';
import { MailchainKeyRegContractCallResolver } from './contractResolvers/mailchain';
import { MessagingKeyNotFoundInContractError } from './contractResolvers/errors';
import { UnexpectedMailchainError } from './errors';

export type GetMessagingKeyLatestNonceResult = MailchainResult<number, GetMessagingKeyLatestNonceError>;
export type GetMessagingKeyLatestNonceError = ProtocolNotSupportedError | UnexpectedMailchainError;

export class AddressNonce {
	constructor(
		private readonly messagingKeysApi: MessagingKeysApiInterface,
		private readonly resolvers: Map<ProtocolType, ContractCallLatestNonce>,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		const mailchainKeyRegistryResolver = MailchainKeyRegContractCallResolver.create(configuration, axiosInstance);
		return new AddressNonce(
			MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			new Map<ProtocolType, ContractCallLatestNonce>([
				[NEAR, NearContractCallResolver.create(configuration, axiosInstance)],
				[ETHEREUM, mailchainKeyRegistryResolver],
				[TEZOS, mailchainKeyRegistryResolver],
			]),
		);
	}

	/**
	 * Get the latest nonce for an address.
	 *
	 * @param address the protocol get the latest nonce for.
	 * @param protocol where to find the address.
	 * @returns The latest nonce for the given address.
	 */
	async getMessagingKeyLatestNonce(
		address: string,
		protocol: ProtocolType,
	): Promise<GetMessagingKeyLatestNonceResult> {
		if (protocol === MAILCHAIN) {
			return { data: 1 }; // currently mailchain accounts do not support incrementing nonces
		}

		const resolver = this.resolvers.get(protocol);
		if (!resolver) {
			return { error: new ProtocolNotSupportedError(protocol) };
		}

		if (!isBlockchainProtocolEnabled(protocol)) {
			return { error: new ProtocolNotSupportedError(protocol) };
		}

		const nonceContractResponse = await this.messagingKeysApi.getProtocolAddressNonce(address, protocol);

		try {
			const nonce = await resolver.latestNonce(nonceContractResponse.data.contractCall);
			return {
				data: nonce,
			};
		} catch (error) {
			if (error instanceof MessagingKeyNotFoundInContractError) {
				return {
					data: 0,
				};
			}
			return {
				error: new UnexpectedMailchainError('Failed to get latest nonce.', error as Error),
			};
		}
	}
}
