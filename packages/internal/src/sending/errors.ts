export class PreflightCheckError extends Error {
	readonly type = 'preflight_check_error';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#preflight_check_failed';
	constructor(message: string) {
		super(`${message}. Try again after fixing the problem.`);
	}
}
