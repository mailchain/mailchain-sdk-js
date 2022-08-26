import { getRandomValues } from '../../crypto/src/getRandomValues';
if (typeof global !== 'undefined' && typeof globalThis.crypto === 'undefined') {
	globalThis.crypto = { ...require('crypto').webcrypto, getRandomValues };
}

export type { Configuration } from './mailchain';
export { Mailchain } from './mailchain';
export type { Address, Attachment, SendMailParams } from './types';
