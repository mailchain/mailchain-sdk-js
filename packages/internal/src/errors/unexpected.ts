export class UnexpectedMailchainError extends Error {
	readonly type = 'unexpected_error';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#unexpected_error';
	constructor(message: string, cause: Error) {
		super(message, { cause });
	}
}
