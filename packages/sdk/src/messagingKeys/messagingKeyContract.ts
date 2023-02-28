import {
	ContractCall,
	createAxiosConfiguration,
	MessagingKeysApiFactory,
	MessagingKeysApiInterface,
} from '@mailchain/api';
import axios, { AxiosInstance } from 'axios';
import { ETHEREUM, NEAR, ProtocolType } from '@mailchain/addressing';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { AddressVerificationFailed } from '@mailchain/signatures';
import { PublicKey } from '@mailchain/crypto';
import { Configuration } from '../mailchain';
import { NearContractCallResolver } from './contractResolvers/near';
import { ContractCallMessagingKeyResolver } from './contractResolvers/resolver';
import { MessagingKeyVerifier } from './verify';
import { ResolvedAddress } from './messagingKeys';
import { MailchainKeyRegContractCallResolver } from './contractResolvers/mailchain';

export class MessagingKeyContractCall {
	constructor(
		private readonly resolvers: Map<ProtocolType, ContractCallMessagingKeyResolver>,
		private readonly messagingKeysApi: MessagingKeysApiInterface,
		private readonly messagingKeyVerifier: MessagingKeyVerifier,
	) {}

	static create(configuration: Configuration, axiosInstance: AxiosInstance = axios.create()) {
		return new MessagingKeyContractCall(
			new Map<ProtocolType, ContractCallMessagingKeyResolver>([
				[NEAR, NearContractCallResolver.create(configuration, axiosInstance)],
				[ETHEREUM, MailchainKeyRegContractCallResolver.create(configuration, axiosInstance)],
			]),
			MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			MessagingKeyVerifier.create(configuration),
		);
	}

	async resolve(
		protocolAddress: string,
		protocol: ProtocolType,
		contractCall: ContractCall,
		identityKey?: PublicKey,
	): Promise<ResolvedAddress> {
		const resolver = this.resolvers.get(protocol);
		if (!resolver) {
			throw new Error(`No resolver for protocol ${protocol}`);
		}

		const contractResponse = await resolver.resolve(contractCall);
		switch (contractResponse.status) {
			case 'ok':
				return {
					messagingKey: contractResponse.messagingKey,
					identityKey,
					protocol: contractResponse.protocol,
					status: 'registered',
				};
			case 'not-found':
				const vendedKeyResponse = await this.messagingKeysApi.getVendedPublicMessagingKey(
					contractCall.address,
					contractCall.protocol as any,
				);

				const verified = await this.messagingKeyVerifier.verifyProvidedKeyProof(
					vendedKeyResponse.data.proof,
					convertPublic(vendedKeyResponse.data.messagingKey),
				);
				if (!verified) {
					throw new AddressVerificationFailed();
				}

				return {
					messagingKey: convertPublic(vendedKeyResponse.data.messagingKey),
					identityKey,
					protocol,
					status: 'vended',
				};
			case 'invalid-key':
			case 'failed-to-call-contract':
				throw contractResponse.cause;
			default:
				throw new Error(`contract call failed with status ${contractResponse.status}`);
		}
	}
}
