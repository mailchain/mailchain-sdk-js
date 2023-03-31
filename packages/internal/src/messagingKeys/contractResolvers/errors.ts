export class MessagingKeyNotFoundInContractError extends Error {
	constructor() {
		super(`Messaging key not found in contract.`);
	}
}

export class InvalidContractResponseError extends Error {
	constructor(problem: string) {
		super(`Messaging key contract returned invalid response.`);
	}
}
