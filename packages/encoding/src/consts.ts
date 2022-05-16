/**
 * Plain hex encoding value.
 */
export const HEX = 'hex/plain';

/**
 * 0x prefixed hex encoding
 */
export const HEX_0X_PREFIX = 'hex/0x-prefix';

export const BASE32 = 'base32/plain';
export const BASE58 = 'base58/plain';
export const BASE64 = 'base64/plain';

export type Encodings = typeof HEX | typeof HEX_0X_PREFIX | typeof BASE32 | typeof BASE58 | typeof BASE64;
