export class ProtocolNotSupportedError extends Error {
	readonly type = 'protocol_unsupported';
	readonly docs = 'https://docs.mailchain.com/developer/errors/codes#protocol_unsupported';
	constructor(public readonly protocol: string) {
		super(`[${protocol}] is an unsupported protocol. Try again with a different protocol.`);
	}
}
