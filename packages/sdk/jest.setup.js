import { TextEncoder, TextDecoder } from 'util';
import { Crypto } from '@peculiar/webcrypto';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// Setup from opaque-ts https://github.com/cloudflare/opaque-ts/blob/main/test/jest.setup-file.mjs
if (typeof crypto === 'undefined') {
	global.crypto = new Crypto();
}
