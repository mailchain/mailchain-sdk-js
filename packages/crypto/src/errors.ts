export class ErrorUnsupportedKey extends Error {
	constructor(curve: string) {
		super(`${curve} is not supported`);
	}
}
