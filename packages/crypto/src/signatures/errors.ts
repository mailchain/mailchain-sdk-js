export class ErrorUnsupportedKey extends Error {
	constructor() {
		super('Unsupported key');
	}
}
export class ErrorProtocolIsEmpty extends Error {
	constructor() {
		super('Protocol Is Empty');
	}
}
export class ErrorAddressIsEmpty extends Error {
	constructor() {
		super('Address Is Empty');
	}
}
