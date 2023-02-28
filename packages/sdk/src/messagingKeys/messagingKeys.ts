import { encodeHexZeroX } from '@mailchain/encoding';
import { ALL_PROTOCOLS, encodeAddressByProtocol, ProtocolType } from '@mailchain/addressing';
import { encodePublicKey, PublicKey } from '@mailchain/crypto';
import {
	AddressesApiFactory,
	createAxiosConfiguration,
	IdentityKeysApiFactory,
	CryptoKeyConvert,
	encodingTypeToEncodingEnum,
	IdentityKeysApiInterface,
	AddressesApiInterface,
} from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { Configuration } from '../mailchain';
import { MessagingKeyProof } from './proof';
import { MessagingKeyContractCall } from './messagingKeyContract';

export type ResolvedAddress = {
	messagingKey: PublicKey;
	identityKey?: PublicKey;
	protocol: ProtocolType;
	network?: string;
	status: 'registered' | 'vended';
};

export type ResolvedManyAddresses = {
	resolved: Map<string, ResolvedAddress>;
	failed: FailedAddressResolutionError[];
};

export class FailedAddressMessageKeyResolutionsError extends Error {
	constructor(public readonly failedResolutions: FailedAddressResolutionError[]) {
		super(`at least one address resolution has failed`);
	}
}

export class FailedAddressResolutionError extends Error {
	constructor(readonly address: string, readonly cause: Error) {
		super(`resolution for ${address} has failed`);
	}
}

export class MessagingKeys {
	constructor(
		private readonly addressApi: AddressesApiInterface,
		private readonly identityKeysApi: IdentityKeysApiInterface,
		private readonly messagingKeyContractCall: MessagingKeyContractCall,
	) {}

	static create(configuration: Configuration) {
		return new MessagingKeys(
			AddressesApiFactory(createAxiosConfiguration(configuration.apiPath)),
			IdentityKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			MessagingKeyContractCall.create(configuration),
		);
	}

	async resolve(address: string): Promise<ResolvedAddress> {
		const { data } = await this.addressApi.getAddressMessagingKey(address);

		const protocol = data.protocol as ProtocolType;
		if (!ALL_PROTOCOLS.includes(protocol)) {
			throw new Error(`unsupported protocol [${data.protocol}]`);
		}

		if (!data.contractCall) {
			throw new Error(`expected contract call`);
		}

		return this.messagingKeyContractCall.resolve(
			data.localPart,
			data.protocol as ProtocolType,
			data.contractCall,
			data.identityKey ? convertPublic(data.identityKey) : undefined,
		);
	}

	async resolveMany(addresses: string[]): Promise<ResolvedManyAddresses> {
		const deduplicatedAddresses = [...new Set(addresses)];
		const resolvedAddresses = await Promise.allSettled(
			deduplicatedAddresses.map(async (address) => {
				const resolvedAddress = await this.resolve(address).catch((e: Error) => {
					throw new FailedAddressResolutionError(address, e);
				});
				return { address, ...resolvedAddress };
			}),
		);

		const resolved: Map<string, ResolvedAddress> = new Map();
		const failed: ResolvedManyAddresses['failed'] = [];
		for (const result of resolvedAddresses) {
			if (result.status === 'fulfilled') {
				resolved.set(result.value.address, result.value);
			} else {
				failed.push(result.reason as FailedAddressResolutionError);
			}
		}

		return { resolved, failed };
	}

	async update(proof: MessagingKeyProof): Promise<void> {
		const encodedIdentityKey = encodeHexZeroX(encodePublicKey(proof.identityKey));
		const encodedAddress = encodeAddressByProtocol(proof.address, proof.protocol);

		await this.identityKeysApi.putMsgKeyByIDKey(encodedIdentityKey, {
			address: {
				encoding: encodingTypeToEncodingEnum(encodedAddress.encoding),
				value: encodedAddress.encoded,
				network: proof.network,
				protocol: proof.protocol,
			},
			locale: proof.locale,
			messageVariant: proof.messageVariant,
			messagingKey: CryptoKeyConvert.public(proof.messagingKey),
			nonce: proof.nonce,
			signature: encodeHexZeroX(proof.signature),
			signatureMethod: proof.signatureMethod,
		});
	}
}
