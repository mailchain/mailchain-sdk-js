import { ALGORAND, ETHEREUM, MAILCHAIN, NEAR, ProtocolType, SUBSTRATE } from './protocols';

export function casingByProtocol(value: string, protocol: ProtocolType): string {
	switch (protocol) {
		case MAILCHAIN:
			return value.toLowerCase(); // case insensitive
		case ETHEREUM:
			return value.toLowerCase(); // case insensitive
		case SUBSTRATE:
			return value; // substrate encoding is case sensitive
		case ALGORAND:
			return value.toLowerCase(); // case insensitive
		case NEAR:
			return value.toLowerCase();
		default:
			throw new Error(`casing for protocol [${protocol}] not defined`);
	}
}
