import { DecodeHex } from '@mailchain/encoding';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PrivateKey, BobSECP256K1PrivateKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSR25519PrivateKey, BobSR25519PrivateKey } from '@mailchain/crypto/sr25519/test.const';
import { PrivateKeyDecrypter } from './private-key-decrypter';

describe('Decrypt', () => {
	const tests = [
		{
			name: 'secp256k1-alice',
			prvKey: AliceSECP256K1PrivateKey,
			message: DecodeHex(
				'2be14142434445464748494a4b4c4d4e4f5051525354555657585ff8026ea550c27f5ec06e3ecdfb0850f3352400b7e9e2',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'secp256k1-bob',
			prvKey: BobSECP256K1PrivateKey,
			message: DecodeHex(
				'2be14142434445464748494a4b4c4d4e4f5051525354555657583abb4c6b03073d8318a8edfa5e3820d761b9d07682e179',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'ed25519-alice',
			prvKey: AliceED25519PrivateKey,
			message: DecodeHex(
				'2be24142434445464748494a4b4c4d4e4f505152535455565758ede31931c34d9e1d251cf6466b1d628957a55bcce73486',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'ed25519-bob',
			prvKey: BobED25519PrivateKey,
			message: DecodeHex(
				'2be24142434445464748494a4b4c4d4e4f5051525354555657581a7d53c9fc1d9b4103f7e9c234f5897688cc68dbadbe17',
			),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'sr25519-alice',
			prvKey: AliceSR25519PrivateKey,
			message: DecodeHex('2ae368afbb2795d629'),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: true,
		},
		{
			name: 'sr25519-bob',
			prvKey: BobSR25519PrivateKey,
			message: DecodeHex('2ae368afbb2795d629'),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, async () => {
			if (test.shouldThrow) {
				expect.assertions(1);
				try {
					const target = new PrivateKeyDecrypter(test.prvKey);
					target.Decrypt(test.message);
				} catch (e) {
					expect(e).toBeDefined();
				}
			} else {
				const target = new PrivateKeyDecrypter(test.prvKey);
				return target.Decrypt(test.message).then((actual) => {
					expect(actual).toEqual(test.expected);
				});
			}
		});
	});
});
