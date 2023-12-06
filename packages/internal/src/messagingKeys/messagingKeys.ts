import { encodeHexZeroX } from '@mailchain/encoding';
import {
	ALL_PROTOCOLS,
	BadlyFormattedAddressError,
	checkAddressForErrors,
	encodeAddressByProtocol,
	IdentityProviderAddressInvalidError,
	isSameAddress,
	ProtocolNotSupportedError,
	ProtocolType,
} from '@mailchain/addressing';
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
import { MailchainResult, partitionMailchainResults, ResultsWithParams } from '../mailchainResult';
import { UnexpectedMailchainError } from '../errors';
import {
	MessagingKeyContactError,
	IdentityNotFoundError,
	IdentityProviderUnsupportedError,
	IdentityProviderAddressUnsupportedError,
	IdentityExpiredError,
	GroupAddressNotSupportedError,
} from './errors';
import { MailchainRegistryMessagingKeyProof, Proof } from './proof';
import { MessagingKeyContractCall } from './messagingKeyContract';

type BaseResolvedAddress = {
	mailchainAddress: string;
	/** Messaging key to be used when communicate with the resolved address. See {@link PublicKey} */
	messagingKey: PublicKey;
	/** Protocol of resolved address. Protocol is determined when resolving the address. */
	protocol: ProtocolType;
	/** Protocol address that has been resolved in the case of name services. */
	protocolAddress: string;
};

export type AddressMessagingKeyStatus = 'vended' | 'registered';

export type RegisteredResolvedAddress = BaseResolvedAddress & {
	/** Indicates the messaging key has been registered by a user. */
	type: 'registered';
	/** Identity key of resolved address. */
	identityKey: PublicKey;
	proof: Proof;
};

export type VendedResolvedAddress = BaseResolvedAddress & {
	/** Indicates the messaging key has been vended by Mailchain. */
	type: 'vended';
	/** Identity key of resolved address. Identity key might be undefined in the case of `vended` messaging key. */
	identityKey?: PublicKey;
};

export type ResolvedAddressItem = RegisteredResolvedAddress | VendedResolvedAddress;
/**
 * Resolved address response containing a proven messaging key.
 */
export type ResolvedAddress = ResolvedAddressItem[];
export type ResolveAddressError =
	| UnexpectedMailchainError
	| BadlyFormattedAddressError
	| IdentityExpiredError
	| IdentityNotFoundError
	| IdentityProviderUnsupportedError
	| IdentityProviderAddressUnsupportedError
	| MessagingKeyContactError
	| MessagingKeyVerificationError
	| ProtocolNotSupportedError
	| IdentityProviderAddressInvalidError;
export type ResolveIndividualAddressError = ResolveAddressError | GroupAddressNotSupportedError;
export type ResolveAddressResult = MailchainResult<ResolvedAddress, ResolveAddressError>;
export type ResolveIndividualAddressResult = MailchainResult<ResolvedAddressItem, ResolveIndividualAddressError>;

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
		private readonly mailchainAddressDomain: string,
	) {}

	static create(configuration: Configuration) {
		return new MessagingKeys(
			AddressesApiFactory(createAxiosConfiguration(configuration.apiPath)),
			IdentityKeysApiFactory(createAxiosConfiguration(configuration.apiPath)),
			MessagingKeyContractCall.create(configuration),
			configuration.mailchainAddressDomain,
		);
	}

	/**
	 * Resolve the messaging key for the given address.
	 *
	 * @param address Address to resolve.
	 * @param at Date to resolve the address at. When no date is provided, the address resolves using the latest block.
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
	async resolve(address: string, at?: Date): Promise<ResolveAddressResult> {
		if (address === '1337@mailchain.local') {
			// THIS IS MOCK, REMOVE!
			const rs = await Promise.all([
				this.resolve('pojiahubsdjaosdinj@mailchain.local'),
				this.resolve('tz1P1xs3qkYNk6cBW273W2UbEVhpWYbwxwZ6@tezos.mailchain.local'),
			]);
			return { data: rs.flatMap((r) => r.data!) };
		}

		const validateAddressError = checkAddressForErrors(address, this.mailchainAddressDomain);
		if (validateAddressError != null) {
			return { error: validateAddressError };
		}
		const { data, error: addressMessagingKeyError } = await this.getAddressMessagingKey(address, at);
		if (addressMessagingKeyError != null) {
			return { error: addressMessagingKeyError };
		}
		const { resolutionType, resolutions: addressMessagingKeyResponses } = data;

		const results = await Promise.all(
			addressMessagingKeyResponses.map(async (addressMessagingKeyResponse) => {
				const { data: resolvedAddress, error: resolveAddressError } =
					await this.messagingKeyContractCall.resolve(
						addressMessagingKeyResponse.contractCall,
						addressMessagingKeyResponse.identityKey
							? convertPublic(addressMessagingKeyResponse.identityKey)
							: undefined,
					);

				if (resolveAddressError) {
					return { params: addressMessagingKeyResponse, result: { error: resolveAddressError } };
				}

				const result: ResolveAddressResult = {
					data: [
						{
							...resolvedAddress,
							mailchainAddress:
								resolutionType === 'group' ? addressMessagingKeyResponse.fullAddress : address,
						},
					],
				};

				return { params: addressMessagingKeyResponse, result };
			}),
		);

		const { successes, failures } = partitionMailchainResults(results);
		if (failures.length > 0) {
			// TODO: return all failures
			return { error: failures[0].error };
		}

		return { data: successes.flatMap((s) => s.data) };
	}

	/**
	 * Resolve the messaging key for the given address. Besides the possible exceptions resulting from the {@link resolve} method,
	 * this method will also throw an exception if the resolved address is a group address.
	 */
	async resolveIndividual(address: string, at?: Date): Promise<ResolveIndividualAddressResult> {
		const { data, error } = await this.resolve(address, at);
		if (error) return { error };

		if (data.length !== 1 || !isSameAddress(data[0].mailchainAddress, address)) {
			return { error: new GroupAddressNotSupportedError(address) };
		}

		return { data: data[0] };
	}

	async resolveMany(
		addresses: string[],
		at?: Date,
	): Promise<MailchainResult<ResolvedManyAddresses, ResolveManyAddressesError>> {
		const deduplicatedAddresses = [...new Set(addresses)];
		const resolvedAddresses = await Promise.all(
			deduplicatedAddresses.map(async (address) => {
				const resolvedAddress = await this.resolve(address, at);
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

	async update(proof: Omit<MailchainRegistryMessagingKeyProof, 'source'>): Promise<void> {
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
		at?: Date,
	): Promise<
		MailchainResult<
			{ resolutionType: 'individual' | 'group'; resolutions: GetAddressMessagingKeyResponseBody[] },
			| IdentityProviderAddressInvalidError
			| BadlyFormattedAddressError
			| IdentityExpiredError
			| IdentityNotFoundError
			| IdentityProviderUnsupportedError
			| IdentityProviderAddressUnsupportedError
			| ProtocolNotSupportedError
			| UnexpectedMailchainError
		>
	> {
		try {
			const atDate: number | undefined = at ? Math.round(at.getTime() / 1000) : undefined;
			const { data } = await this.addressApi.getAddressMessagingKeys(address, atDate);

			const results = await Promise.all<
				ResultsWithParams<GetAddressMessagingKeyResponseBody, ProtocolNotSupportedError, string>
			>(
				data.map((d) => {
					const protocol = d.contractCall.protocol as ProtocolType;
					if (!ALL_PROTOCOLS.includes(protocol)) {
						return { result: { error: new ProtocolNotSupportedError(protocol) }, params: d.fullAddress };
					}

					return { result: { data: d }, params: d.fullAddress };
				}),
			);

			const { successes, failures } = partitionMailchainResults(results);
			if (failures.length > 0) {
				// TODO: return all failures
				return failures[0];
			}

			// TODO: add check for resolutionType implemented in https://github.com/mailchain/monorepo/issues/2337
			return {
				data: {
					resolutionType: successes.length === 1 ? 'individual' : 'group',
					resolutions: successes.map((s) => s.data),
				},
			};
		} catch (e) {
			if (isAxiosError(e)) {
				switch (e.response?.data?.code) {
					case 'identity_provider_unsupported':
						return {
							error: new IdentityProviderUnsupportedError(),
						};
					case 'identity_expired':
						return {
							error: new IdentityExpiredError(),
						};
					case 'identity_provider_address_unsupported':
						return {
							error: new IdentityProviderAddressUnsupportedError(),
						};
					case 'identity_not_found':
						return {
							error: new IdentityNotFoundError(),
						};
					case 'address_format_invalid':
					case 'tld_unknown':
						return {
							error: new BadlyFormattedAddressError(),
						};
					case 'identity_address_invalid':
						return {
							error: new IdentityProviderAddressInvalidError(),
						};
				}
			}
			return {
				error: new UnexpectedMailchainError(`Failed to resolve messaging key of address ${address}`, {
					cause: e as Error,
				}),
			};
		}
	}

	async getAddressMessagingKeyStatus(
		address: string,
		at?: Date,
	): Promise<MailchainResult<AddressMessagingKeyStatus, IdentityProviderUnsupportedError>> {
		try {
			const atDate: number | undefined = at ? Math.round(at.getTime() / 1000) : undefined;
			const { data } = await this.addressApi.getAddressMessagingKeyStatus(address, atDate);
			return { data: data.status as AddressMessagingKeyStatus };
		} catch (e) {
			return {
				error: new IdentityProviderUnsupportedError(),
			};
		}
	}
}
