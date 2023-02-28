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
import { AddressVerificationFailed } from '@mailchain/signatures';
import { Configuration } from '../mailchain';
import { Verifier } from './verify';
import { MessagingKeyProof } from './proof';

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
		private readonly verifier: Verifier,
		private readonly addressApi: AddressesApiInterface,
		private readonly identityKeysApi: IdentityKeysApiInterface,
	) {}

	static create(configuration: Configuration) {
		return new MessagingKeys(
			Verifier.create(configuration),
			AddressesApiFactory(createAxiosConfiguration(configuration.apiPath)),
			IdentityKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
		);
	}

	async resolve(address: string): Promise<ResolvedAddress> {
		const { data } = await this.addressApi.getAddressMessagingKey(address);
		const status = data.registeredKeyProof ? 'registered' : 'vended';

		const verifyResult = await this.verifier.verifyAddressMessagingKey(data);
		if (!verifyResult.result) {
			throw new AddressVerificationFailed();
		}

		const protocol = data.protocol as ProtocolType;
		if (!ALL_PROTOCOLS.includes(protocol)) {
			throw new Error(`invalid address protocol of [${data.protocol}]`);
		}

		return { messagingKey: verifyResult.messagingKey, identityKey: verifyResult.identityKey, protocol, status };
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
