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
	readonly type = 'messaging_key_validation_failed';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#messaging_key_validation_failed';
	constructor() {
		super('Messaging key validation failed and is not useable for this address.');
	}
}

export class SenderMessagingKeyIncorrect extends Error {
	readonly type = 'sender_messaging_key_incorrect';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#sender_messaging_key_incorrect';
	constructor() {
		super('Messaging key is not owner by the sender. Use the latest messaging key owned by sender address.');
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
