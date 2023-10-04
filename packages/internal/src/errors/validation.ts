export class ValidationError extends Error {
	constructor(message: string, errorOptions?: { cause?: Error }) {
		super(message, errorOptions);
	}
}
