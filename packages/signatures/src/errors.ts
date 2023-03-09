export class ProtocolIsEmptyError extends Error {
	constructor() {
		super('protocol is empty');
	}
}
export class AddressIsEmptyError extends Error {
	constructor() {
		super('address is empty');
	}
}

export class MessagingKeyVerificationError extends Error {
	readonly type = 'messaging_key_verification_failed';
	constructor() {
		super('Messaging key signature failed to verify. Messaging key must not be used for this address.');
	}
}

export class AddressMustBeProtocolAddressError extends Error {
	constructor() {
		super('address must be a protocol address');
	}
}

export class PublicKeyNotFoundError extends Error {
	constructor() {
		super('mailchain public key not found');
	}
}
