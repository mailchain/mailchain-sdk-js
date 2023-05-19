import { encodeHexZeroX } from '@mailchain/encoding';
import { ALL_PROTOCOLS, encodeAddressByProtocol, ProtocolNotSupportedError, ProtocolType } from '@mailchain/addressing';
import { publicKeyToBytes, PublicKey } from '@mailchain/crypto';
import {
	AddressesApiFactory,
	createAxiosConfiguration,
	IdentityKeysApiFactory,
	CryptoKeyConvert,
	encodingTypeToEncodingEnum,
	IdentityKeysApiInterface,
	AddressesApiInterface,
	GetAddressMessagingKeyResponseBody,
} from '@mailchain/api';
import { convertPublic } from '@mailchain/api/helpers/apiKeyToCryptoKey';
import { MessagingKeyVerificationError } from '@mailchain/signatures';
import { isAxiosError } from 'axios';
import { Configuration } from '../configuration';
import { MailchainResult, partitionMailchainResults } from '../';
import {
	MessagingKeyContactError,
	IdentityNotFoundError,
	AddressInvalidError,
	UnexpectedMailchainError,
	IdentityProviderUnsupportedError,
} from './errors';
import { MessagingKeyProof } from './proof';
import { MessagingKeyContractCall } from './messagingKeyContract';

type BaseResolvedAddress = {
	/** Messaging key to be used when communicate with the resolved address. See {@link PublicKey} */
	messagingKey: PublicKey;
	/** Protocol of resolved address. Protocol is determined when resolving the address. */
	protocol: ProtocolType;
	/** Identity key of resolved address. Identity key might be undefined in the case of `vended` messaging key. */
	identityKey?: PublicKey;
	/** Protocol address that has been resolved in the case of name services. */
	protocolAddress: string;
};

export type AddressMessagingKeyStatus = 'vended' | 'registered';

export type RegisteredResolvedAddress = BaseResolvedAddress & {
	/** Indicates the messaging key has been registered by a user. */
	type: 'registered';
};

export type VendedResolvedAddress = BaseResolvedAddress & {
	/** Indicates the messaging key has been vended by Mailchain. */
	type: 'vended';
};

/**
 * Resolved address response containing a proven messaging key.
 */
export type ResolvedAddress = RegisteredResolvedAddress | VendedResolvedAddress;
export type ResolveAddressError =
	| UnexpectedMailchainError
	| IdentityNotFoundError
	| IdentityProviderUnsupportedError
	| MessagingKeyContactError
	| MessagingKeyVerificationError
	| ProtocolNotSupportedError
	| AddressInvalidError;
export type ResolveAddressResult = MailchainResult<ResolvedAddress, ResolveAddressError>;

export type ResolvedManyAddresses = Map<string, ResolvedAddress>;
export type ResolvedManyAddressesResult = MailchainResult<ResolvedManyAddresses>;
export type ResolveManyAddressesError = ResoleAddressesFailuresError;

export class ResoleAddressesFailuresError extends Error {
	readonly type = 'resolve_addresses_failures';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#resolve_addresses_failures';
	constructor(
		public readonly successes: Array<{ params: string; data: ResolvedAddress }>,
		public readonly failures: Array<{ params: string; error: ResolveAddressError }>,
	) {
		super(`Not all addresses were resolved. Check the failed resolutions for more information.`);
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

	/**
	 * Resolve the messaging key for the given address.
	 *
	 * @param address Address to resolve.
	 *
	 * @returns A {@link ResolvedAddress resolved address} which may be a registered or vended.
	 *
	 * @example
	 * import { messagingKeys } from '@mailchain/sdk';
	 *
	 * const resolvedAddress = await messagingKeys.resolve(address);
	 * console.log(resolvedAddress);
	 *
	 */
	async resolve(address: string): Promise<ResolveAddressResult> {
		const { data, error } = await this.getAddressMessagingKey(address);
		if (error != null) {
			return { error };
		}

		return this.messagingKeyContractCall.resolve(
			data.protocol as ProtocolType,
			data.contractCall,
			data.identityKey ? convertPublic(data.identityKey) : undefined,
		);
	}

	async resolveMany(addresses: string[]): Promise<MailchainResult<ResolvedManyAddresses, ResolveManyAddressesError>> {
		const deduplicatedAddresses = [...new Set(addresses)];
		const resolvedAddresses = await Promise.all(
			deduplicatedAddresses.map(async (address) => {
				const resolvedAddress = await this.resolve(address);
				return { params: address, result: resolvedAddress };
			}),
		);

		const { failures, successes } = partitionMailchainResults(resolvedAddresses);

		if (failures.length > 0) {
			return { error: new ResoleAddressesFailuresError(successes, failures) };
		}

		return {
			data: new Map(successes.map((r) => [r.params, r.data])),
		};
	}

	async update(proof: MessagingKeyProof): Promise<void> {
		const encodedIdentityKey = encodeHexZeroX(publicKeyToBytes(proof.identityKey));
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

	private async getAddressMessagingKey(
		address: string,
	): Promise<
		MailchainResult<
			GetAddressMessagingKeyResponseBody,
			| AddressInvalidError
			| IdentityNotFoundError
			| IdentityProviderUnsupportedError
			| ProtocolNotSupportedError
			| UnexpectedMailchainError
		>
	> {
		try {
			const { data } = await this.addressApi.getAddressMessagingKey(address);

			const protocol = data.protocol as ProtocolType;
			if (!ALL_PROTOCOLS.includes(protocol)) {
				return { error: new ProtocolNotSupportedError(protocol) };
			}

			return { data };
		} catch (e) {
			if (isAxiosError(e)) {
				switch (e.response?.data?.code) {
					case 'identity_provider_unsupported':
						return {
							error: new IdentityProviderUnsupportedError(),
						};
					case 'identity_not_found':
						return {
							error: new IdentityNotFoundError(),
						};
					case 'address_invalid':
					case 'identity_address_invalid':
					case 'tld_unknown':
						return {
							error: new AddressInvalidError(new Error(e.response?.data?.message)),
						};
				}
			}
			return {
				error: new UnexpectedMailchainError(`Failed to resolve messaging key of address ${address}`, e),
			};
		}
	}

	async getAddressMessagingKeyStatus(
		address: string,
	): Promise<MailchainResult<AddressMessagingKeyStatus, IdentityProviderUnsupportedError>> {
		try {
			const { data } = await this.addressApi.getAddressMessagingKeyStatus(address);
			return { data: data.status as AddressMessagingKeyStatus };
		} catch (e) {
			return {
				error: new IdentityProviderUnsupportedError(),
			};
		}
	}
}
