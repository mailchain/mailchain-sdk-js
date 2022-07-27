import { getOpaqueConfig, OpaqueID } from '@cloudflare/opaque-ts';
import { OpaqueConfig } from '../types';

export const defaultOpaqueConfig = () =>
	({
		parameters: getOpaqueConfig(OpaqueID.OPAQUE_P256),
		serverIdentity: 'Mailchain',
		context: 'MailchainAuthentication',
	} as OpaqueConfig);
