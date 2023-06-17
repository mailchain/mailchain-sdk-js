import { AliceED25519PrivateKey, BobED25519PrivateKey } from '../../ed25519/test.const';
import { AliceSECP256K1PrivateKey, BobSECP256K1PrivateKey } from '../../secp256k1/test.const';
import { PrivateKeyDecrypter } from './privateKeyDecrypter';

describe('Decrypt', () => {
	const tests = [
		{
			name: 'secp256k1-alice',
			prvKey: AliceSECP256K1PrivateKey,
			message: Buffer.from(
				'2be14142434445464748494a4b4c4d4e4f5051525354555657585ff8026ea550c27f5ec06e3ecdfb0850f3352400b7e9e2',
				'hex',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'secp256k1-bob',
			prvKey: BobSECP256K1PrivateKey,
			message: Buffer.from(
				'2be14142434445464748494a4b4c4d4e4f5051525354555657583abb4c6b03073d8318a8edfa5e3820d761b9d07682e179',
				'hex',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'ed25519-alice',
			prvKey: AliceED25519PrivateKey,
			message: Buffer.from(
				'2be24142434445464748494a4b4c4d4e4f505152535455565758ede31931c34d9e1d251cf6466b1d628957a55bcce73486',
				'hex',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			prvKey: BobED25519PrivateKey,
			message: Buffer.from(
				'2be24142434445464748494a4b4c4d4e4f5051525354555657581a7d53c9fc1d9b4103f7e9c234f5897688cc68dbadbe17',
				'hex',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			try {
				const target = new PrivateKeyDecrypter(test.prvKey);
				target.decrypt(test.message);
			} catch (e) {
				expect(e).toBeDefined();
			}
		} else {
			const target = new PrivateKeyDecrypter(test.prvKey);
			return target.decrypt(test.message).then((actual) => {
				expect(actual).toEqual(test.expected);
			});
		}
	});
});
