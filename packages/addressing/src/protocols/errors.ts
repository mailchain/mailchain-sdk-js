export class ProtocolNotSupportedError extends Error {
	readonly type = 'protocol_not_supported';
	constructor(public readonly protocol: string) {
		super(`Protocol [${protocol}] is an unsupported protocol. Try again with a different protocol.`);
	}
}
