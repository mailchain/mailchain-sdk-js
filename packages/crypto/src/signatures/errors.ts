export class ErrorUnsupportedKey extends Error {
	constructor(curve: string) {
		super(`${curve} is not supported`);
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
