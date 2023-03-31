export class PreflightCheckError extends Error {
	readonly type = 'preflight_check_error';
	constructor(message: string) {
		super(`${message}. Try again after fixing the problem.`);
	}
}
