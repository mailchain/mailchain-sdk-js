export class MessagingKeyNotFoundInContractError extends Error {
	constructor() {
		super(`Messaging key not found in contract.`);
	}
}

export class InvalidContractResponseError extends Error {
	constructor(public readonly problem: string) {
		super(`Messaging key contract returned invalid response. ${problem}}`);
	}
}
