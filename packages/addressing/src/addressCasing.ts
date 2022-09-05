import { ALGORAND, ETHEREUM, MAILCHAIN, ProtocolType, SUBSTRATE } from '.';

export function casingByProtocol(value: string, protocol: ProtocolType): string {
	switch (protocol) {
		case MAILCHAIN:
			return value.toLowerCase(); // case insensitive
		case ETHEREUM:
			return value.toLowerCase(); // case insensitive
		case SUBSTRATE:
			return value; // substrate encoding is case sensitive
		case ALGORAND:
			return value.toUpperCase(); // case insensitive
	}
}
