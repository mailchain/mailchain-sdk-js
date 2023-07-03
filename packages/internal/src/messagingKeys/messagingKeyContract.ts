import {
	ContractCall,
	createAxiosConfiguration,
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
} from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { ETHEREUM, NEAR, TEZOS, ProtocolType } from '@mailchain/addressing';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { MessagingKeyVerificationError } from '@mailchain/signatures';
import { PublicKey } from '@mailchain/crypto';
import { MAILCHAIN, ProtocolNotSupportedError } from '@mailchain/addressing/protocols';
import { Configuration, MailchainResult } from '../';
import { NearContractCallResolver } from './contractResolvers/near';
import { ContractCallMessagingKeyResolver } from './contractResolvers/resolver';
import { MessagingKeyVerifier } from './verify';
import { MailchainKeyRegContractCallResolver } from './contractResolvers/mailchain';
import { InvalidContractResponseError, MessagingKeyNotFoundInContractError } from './contractResolvers/errors';
import { ResolvedAddress, ResolveAddressError } from './messagingKeys';
import { MessagingKeyContactError } from './errors';

export class MessagingKeyContractCall {
	constructor(
		private readonly resolvers: Map<ProtocolType, ContractCallMessagingKeyResolver>,
		private readonly messagingKeysApi: MessagingKeysApiInterface,
		private readonly messagingKeyVerifier: MessagingKeyVerifier,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		const mailchainKeyRegistryResolver = MailchainKeyRegContractCallResolver.create(configuration, axiosInstance);
		return new MessagingKeyContractCall(
			new Map<ProtocolType, ContractCallMessagingKeyResolver>([
				[ETHEREUM, mailchainKeyRegistryResolver],
				[MAILCHAIN, mailchainKeyRegistryResolver],
				[NEAR, NearContractCallResolver.create(configuration, axiosInstance)],
				[TEZOS, mailchainKeyRegistryResolver],
			]),
			MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			MessagingKeyVerifier.create(configuration),
		);
	}

	async resolve(
		contractCall: ContractCall,
		identityKey?: PublicKey,
	): Promise<MailchainResult<ResolvedAddress, ResolveAddressError>> {
		const protocol = contractCall.protocol as ProtocolType;
		const resolver = this.resolvers.get(protocol);
		if (!resolver) {
			return { error: new ProtocolNotSupportedError(protocol) };
		}

		const { data, error } = await resolver.resolve(contractCall);
		if (error != null) {
			if (error instanceof MessagingKeyNotFoundInContractError) {
				const vendedKeyResponse = await this.messagingKeysApi.getVendedPublicMessagingKey(
					contractCall.address,
					protocol as any,
				);
				const verified = await this.messagingKeyVerifier.verifyProvidedKeyProof(
					vendedKeyResponse.data.proof,
					convertPublic(vendedKeyResponse.data.messagingKey),
				);
				if (!verified) {
					return { error: new MessagingKeyVerificationError() };
				}
				return {
					data: {
						messagingKey: convertPublic(vendedKeyResponse.data.messagingKey),
						identityKey,
						protocol,
						type: 'vended',
						protocolAddress: contractCall.address,
					},
				};
			} else if (error instanceof InvalidContractResponseError) {
				return { error: new MessagingKeyContactError(error) };
			}
			return {
				error: new MessagingKeyContactError(error),
			};
		}

		const { messagingKey } = data;
		return {
			data: { type: 'registered', messagingKey, identityKey, protocol, protocolAddress: contractCall.address },
		};
	}
}
