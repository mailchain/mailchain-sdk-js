export class BadlyFormattedAddressError extends Error {
	readonly type = 'badly_formatted_address';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#badly';
	constructor() {
		super('Address format is invalid. Check that the format follows the Mailchain address standard.');
	}
}

export class IdentityProviderAddressInvalidError extends Error {
	readonly type = 'identity_provider_address_invalid';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_provider_address_invalid';
	constructor() {
		super(`Address is not valid for the identity provider. Check address is valid for the identity provider.`);
	}
}
