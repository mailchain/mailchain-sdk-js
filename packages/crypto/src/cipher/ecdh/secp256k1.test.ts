import {
	BobSECP256K1PublicKey,
	AliceSECP256K1PublicKey,
	BobSECP256K1PrivateKey,
	AliceSECP256K1PrivateKey,
} from '../../secp256k1/test.const';
import { SECP256K1KeyExchange } from './secp256k1';

describe('shared-secret', () => {
	const tests = [
		{
			name: 'success-bob-alice',
			prvKey: BobSECP256K1PrivateKey,
			pubKey: AliceSECP256K1PublicKey,
			expected: new Uint8Array([
				0xb6, 0xbd, 0xfa, 0xde, 0x23, 0x17, 0x82, 0x72, 0x42, 0x5d, 0x25, 0x77, 0x4a, 0x7d, 0xd, 0x38, 0x8f,
				0xbe, 0xf9, 0x48, 0x8, 0x93, 0xfc, 0xc3, 0x64, 0x6a, 0xcc, 0xc1, 0x23, 0xea, 0xcc, 0x47,
			]),
			shouldThrow: false,
		},
		{
			name: 'success-alice-bob',
			prvKey: AliceSECP256K1PrivateKey,
			pubKey: BobSECP256K1PublicKey,
			expected: new Uint8Array([
				0xb6, 0xbd, 0xfa, 0xde, 0x23, 0x17, 0x82, 0x72, 0x42, 0x5d, 0x25, 0x77, 0x4a, 0x7d, 0xd, 0x38, 0x8f,
				0xbe, 0xf9, 0x48, 0x8, 0x93, 0xfc, 0xc3, 0x64, 0x6a, 0xcc, 0xc1, 0x23, 0xea, 0xcc, 0x47,
			]),
			shouldThrow: false,
		},
		{
			name: 'err-alice-alice',
			prvKey: AliceSECP256K1PrivateKey,
			pubKey: AliceSECP256K1PublicKey,
			expected: null,
			shouldThrow: true,
		},
		{
			name: 'err-bob-bob',
			prvKey: BobSECP256K1PrivateKey,
			pubKey: BobSECP256K1PublicKey,
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = new SECP256K1KeyExchange((num?: number): Uint8Array => {
			return new Uint8Array([]);
		});
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.SharedSecret(test.prvKey, test.pubKey).catch((e) => expect(e).toBeDefined());
		}
		return target.SharedSecret(test.prvKey, test.pubKey).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
