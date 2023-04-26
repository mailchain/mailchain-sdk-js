export class MessagingKeyContactError extends Error {
	readonly type = 'messaging_key_contact_call_error';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#messaging_key_contact_call_error';
	constructor(readonly cause: Error) {
		super(`Failed calling messaging key contract.`);
	}
}

export class UnexpectedMailchainError extends Error {
	readonly type = 'unexpected_error';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#unexpected_error';
	constructor(message: string, cause: any) {
		super(message, { cause });
	}
}

export class IdentityNotFoundError extends Error {
	readonly type = 'identity_not_found';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#identity_not_found';
	constructor() {
		super(`Identity is not found. Check address and try again.`);
	}
}

export class AddressInvalidError extends Error {
	readonly type = 'address_invalid';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#address_invalid';
	constructor() {
		super(`Address is invalid. Check address format and try again.`);
	}
}

export class MessagingKeyNotRegisteredError extends Error {
	readonly type = 'messaging_key_unregistered';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#messaging_key_unregistered';
	constructor() {
		super('Messaging key is not registered. Register address and try again.');
	}
}
