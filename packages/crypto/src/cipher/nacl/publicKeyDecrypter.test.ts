import { AliceED25519PrivateKey, BobED25519PrivateKey } from '../../ed25519/test.const';
import { ED25519KeyExchange } from '../ecdh/ed25519';
import { PublicKeyDecrypter } from '.';

describe('Decrypt', () => {
	const tests = [
		{
			name: 'ed25519-alice',
			keyEx: new ED25519KeyExchange(),
			prvKey: AliceED25519PrivateKey,
			message: new Uint8Array([
				0x2a, 0xe2, 0x80, 0x56, 0xec, 0xbf, 0x3c, 0xc5, 0xac, 0xd1, 0x60, 0xdd, 0xf0, 0x22, 0x97, 0xbb, 0xba,
				0xa1, 0x55, 0x5b, 0xde, 0xa0, 0x4, 0xc2, 0x9b, 0xa9, 0x96, 0x48, 0x89, 0xe1, 0xdc, 0xcd, 0x1, 0x5b,
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x77, 0x66, 0x5d, 0x95, 0x6d, 0x2f, 0x8e, 0x7, 0x7e, 0x90,
				0x7, 0xa4, 0xa1, 0xff, 0x59, 0x9c, 0xbf, 0xf9, 0x38, 0x16, 0xd6, 0x8e, 0xed,
			]),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			keyEx: new ED25519KeyExchange(),
			prvKey: BobED25519PrivateKey,
			message: new Uint8Array([
				0x2a, 0xe2, 0x80, 0x56, 0xec, 0xbf, 0x3c, 0xc5, 0xac, 0xd1, 0x60, 0xdd, 0xf0, 0x22, 0x97, 0xbb, 0xba,
				0xa1, 0x55, 0x5b, 0xde, 0xa0, 0x4, 0xc2, 0x9b, 0xa9, 0x96, 0x48, 0x89, 0xe1, 0xdc, 0xcd, 0x1, 0x5b,
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0xc2, 0x45, 0x87, 0x8, 0x51, 0xe3, 0x9b, 0xff, 0x31, 0x8,
				0x9f, 0x40, 0xb6, 0x99, 0x57, 0x99, 0xef, 0x20, 0xba, 0x8e, 0x3b, 0xfd, 0xd1,
			]),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = new PublicKeyDecrypter(test.keyEx, test.prvKey);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.decrypt(test.message).catch((e) => expect(e).toBeDefined());
		}
		return target.decrypt(test.message).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
