export class ErrorUnsupportedKey extends Error {
	constructor() {
		super('unsupported key');
	}
}
export class ErrorProtocolIsEmpty extends Error {
	constructor() {
		super('protocol is empty');
	}
}
export class ErrorAddressIsEmpty extends Error {
	constructor() {
		super('address is empty');
	}
}

export class AddressVerificationFailed extends Error {
	constructor() {
		super('address verification failed');
	}
}

export class PublicKeyNotFoundFailed extends Error {
	constructor() {
		super('mailchain public key not found');
	}
}
