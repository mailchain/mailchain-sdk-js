import {
	BadlyFormattedAddressError,
	checkAddressForErrors,
	IdentityProviderAddressInvalidError,
	ProtocolNotSupportedError,
} from '@mailchain/addressing';
import { AddressesApiFactory, createAxiosConfiguration, AddressesApiInterface, Metadata } from '@mailchain/api';
import { isAxiosError } from 'axios';
import { Configuration } from '../configuration';
import { MailchainResult } from '../';
import { UnexpectedMailchainError } from '../errors';
import { ResolveAddressError } from '../messagingKeys/messagingKeys';
import {
	IdentityNotFoundError,
	IdentityProviderUnsupportedError,
	IdentityProviderAddressUnsupportedError,
	IdentityExpiredError,
} from '../messagingKeys/errors';

export type AddressMetadataResult = MailchainResult<Metadata, ResolveAddressError>;

export class MetaData {
	constructor(private readonly addressApi: AddressesApiInterface, private readonly mailchainAddressDomain: string) {}

	static create(configuration: Configuration) {
		return new MetaData(
			AddressesApiFactory(createAxiosConfiguration(configuration.apiPath)),
			configuration.mailchainAddressDomain,
		);
	}

	/**
	 * Get metadata for the given address.
	 *
	 * @param address Address to get metadata for.
	 *
	 * @returns A {@link Metadata for address} which may be a token or an image.
	 *
	 * @example
	 * import { metadata } from '@mailchain/sdk';
	 *
	 * const addressMetadata = await metadata.addressMetadata(address);
	 * console.log(resolvedAddress);
	 *
	 */
	async addressMetadata(address: string): Promise<AddressMetadataResult> {
		const validateAddressError = checkAddressForErrors(address, this.mailchainAddressDomain);
		if (validateAddressError != null) {
			return { error: validateAddressError };
		}
		const { data, error } = await this.getAddressMetadata(address);
		if (error != null) {
			return { error };
		}

		return { data };
	}

	private async getAddressMetadata(
		address: string,
	): Promise<
		MailchainResult<
			Metadata,
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
			const { data } = await this.addressApi.getAddressMetadata(address);
			return { data };
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
				error: new UnexpectedMailchainError(`Failed to get metadata for address ${address}`, e as Error),
			};
		}
	}
}
