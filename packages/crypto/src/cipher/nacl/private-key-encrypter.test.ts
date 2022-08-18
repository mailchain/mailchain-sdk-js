import { AliceED25519PrivateKey, BobED25519PrivateKey } from '../../ed25519/test.const';
import { AliceSECP256K1PrivateKey, BobSECP256K1PrivateKey } from '../../secp256k1/test.const';
import { AliceSR25519PrivateKey, BobSR25519PrivateKey } from '../../sr25519/test.const';
import { PrivateKeyEncrypter } from './private-key-encrypter';

describe('Encrypt', () => {
	const tests = [
		{
			name: 'secp256k1-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: AliceSECP256K1PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2be14142434445464748494a4b4c4d4e4f5051525354555657585ff8026ea550c27f5ec06e3ecdfb0850f3352400b7e9e2',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'secp256k1-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: BobSECP256K1PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2be14142434445464748494a4b4c4d4e4f5051525354555657583abb4c6b03073d8318a8edfa5e3820d761b9d07682e179',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'ed25519-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: AliceED25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f505152535455565758ede31931c34d9e1d251cf6466b1d628957a55bcce73486',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: BobED25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			expected: Uint8Array.from(
				Buffer.from(
					'2be24142434445464748494a4b4c4d4e4f5051525354555657581a7d53c9fc1d9b4103f7e9c234f5897688cc68dbadbe17',
					'hex',
				),
			),
			shouldThrow: false,
		},
		{
			name: 'sr25519-alice',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: AliceSR25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: true,
		},
		{
			name: 'sr25519-bob',
			rand: (num?: number): Uint8Array => {
				return new Uint8Array(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ascii')).slice(0, num);
			},
			prvKey: BobSR25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect.assertions(1);
			try {
				const target = new PrivateKeyEncrypter(test.prvKey, test.rand);
				target.encrypt(test.message);
			} catch (e) {
				expect(e).toBeDefined();
			}
		} else {
			const target = new PrivateKeyEncrypter(test.prvKey, test.rand);
			return target.encrypt(test.message).then((actual) => {
				expect(actual).toEqual(test.expected);
			});
		}
	});
});
