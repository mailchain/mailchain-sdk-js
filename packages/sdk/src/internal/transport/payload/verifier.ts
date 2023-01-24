import { Payload } from './payload';

export class ErrorPayloadSignatureInvalid extends Error {
	constructor() {
		super('payload signature invalid');
	}
}

export class PayloadOriginVerifier {
	static create() {
		return new PayloadOriginVerifier();
	}

	async verifyPayloadOrigin(payload: Payload) {
		if (!payload.Headers) {
			throw new Error('payload does not contain Headers');
		}

		if (!payload.Headers.Origin) {
			throw new Error('payload does not contain Headers.Origin');
		}

		if (!(await payload.Headers.Origin.verify(payload.Content, payload.Headers.ContentSignature))) {
			throw new ErrorPayloadSignatureInvalid();
		}
	}
}
