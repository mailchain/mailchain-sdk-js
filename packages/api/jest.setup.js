import crypto from 'crypto';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

Object.defineProperty(global.self, 'crypto', {
	value: {
		getRandomValues: (arr) => crypto.randomBytes(arr.length),
		subtle: crypto.webcrypto.subtle,
		createPrivateKey: crypto.webcrypto.createPrivateKey,
	},
});
