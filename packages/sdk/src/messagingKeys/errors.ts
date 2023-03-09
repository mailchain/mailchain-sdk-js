export class MessagingKeyContactError extends Error {
	readonly type = 'messaging_key_contact_error';
	constructor(readonly cause: Error) {
		super(`Failed calling messaging key contract.`);
	}
}

export class UnexpectedMailchainError extends Error {
	readonly type = 'unexpected_error';
	constructor(message: string, cause: any) {
		super(message, { cause });
	}
}

export class NameserviceAddressNotFoundError extends Error {
	readonly type = 'nameservice_address_not_found';
	constructor() {
		super(`Name service address is not found. Check address is present on nameservice.`);
	}
}

export class NameserviceAddressUnresolvableError extends Error {
	readonly type = 'nameservice_address_unresolvable';
	constructor() {
		super(`Name service address is unremovable. Check registry entry in nameservice.`);
	}
}
