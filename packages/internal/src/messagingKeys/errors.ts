export class MessagingKeyContactError extends Error {
	readonly type = 'messaging_key_contact_call_error';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#messaging_key_contact_call_error';
	constructor(cause: Error) {
		super(`Failed calling messaging key contract.`, { cause });
	}
}

export class IdentityExpiredError extends Error {
	readonly type = 'identity_expired';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_expired';
	constructor() {
		super(`Identity has expired. Check identity provider settings.`);
	}
}

export class IdentityProviderUnsupportedError extends Error {
	readonly type = 'identity_provider_unsupported';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_provider_unsupported';
	constructor() {
		super(`Identity provider is not supported. Check list of supported providers.`);
	}
}
export class IdentityNotFoundError extends Error {
	readonly type = 'identity_not_found';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_not_found';
	constructor() {
		super(`Identity is not found. Check address exists on supplied identity provider.`);
	}
}

export class IdentityProviderAddressUnsupportedError extends Error {
	readonly type = 'identity_provider_address_unsupported';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_provider_address_unsupported';
	constructor() {
		super(`Identity is not supported by the provider. Check identity provider supported addresses.`);
	}
}

export class AddressNotRegisteredError extends Error {
	readonly type = 'address_unregistered';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#address_unregistered';
	constructor() {
		super('Address is not registered. Register address, then try again.');
	}
}

export class GroupAddressNotSupportedError extends Error {
	readonly type = 'group_address_not_supported';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#group_address_not_supported';
	constructor(public readonly address: string) {
		super(`Group addresses are not supported, the provided ${address} is a group address.`);
	}
}
