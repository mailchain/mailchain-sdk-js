import { Config } from '@cloudflare/opaque-ts';

export interface OpaqueConfig {
	serverIdentity: string;
	parameters: Config;
	context: string;
}
