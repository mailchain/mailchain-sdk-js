import {
	AliceED25519PublicKey,
	BobED25519PublicKey,
	AliceED25519PrivateKey,
	BobED25519PrivateKey,
} from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, AliceSECP256K1PrivateKey } from '@mailchain/crypto/secp256k1/test.const';
import { ErrorUnsupportedKey } from '@mailchain/crypto';
import {
	mailchainPasswordResetMessage,
	signMailchainPasswordReset,
	verifyMailchainPasswordReset,
} from './mailchain_password_reset';

describe('mailchainPasswordResetMessage()', () => {
	it('creates message', () => {
		expect(mailchainPasswordResetMessage(Buffer.from('alice', 'utf-8'), new Date('2022.01.01')).toString()).toEqual(
			'\x11Mailchain:\naction: reset-password\nexpires: 1640995200\nusername: alice',
		);
		expect(mailchainPasswordResetMessage(Buffer.from('bob', 'utf-8'), new Date('2022.02.01')).toString()).toEqual(
			'\x11Mailchain:\naction: reset-password\nexpires: 1643673600\nusername: bob',
		);
	});
});

describe('verifyMailchainPasswordReset()', () => {
	const tests = [
		{
			name: `valid-sig-ed25519-alice`,
			args: {
				key: AliceED25519PublicKey,
				message: Buffer.from('alice', 'utf-8'),
				signature: new Uint8Array([
					0xec, 0x2c, 0xf8, 0x51, 0x9b, 0x68, 0xc1, 0xe8, 0xf4, 0x2d, 0x10, 0xd3, 0xb9, 0xf4, 0x5a, 0x3f,
					0x4a, 0x51, 0x5a, 0xc1, 0xa0, 0x1d, 0x2e, 0x15, 0xd1, 0x44, 0x6b, 0x56, 0xf4, 0xa2, 0x9e, 0xd6,
					0xc9, 0x20, 0x43, 0x71, 0x6b, 0x80, 0xad, 0xe9, 0xe9, 0x2b, 0x1c, 0xee, 0xa4, 0xf8, 0x3e, 0x15,
					0x3e, 0xaf, 0x94, 0x2, 0xb6, 0x18, 0x53, 0x57, 0x23, 0x45, 0xe9, 0xc1, 0xb4, 0xa1, 0x6d, 0x2,
				]),
				expires: new Date('2022.01.01'),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `valid-sig-ed25519-bob`,
			args: {
				key: BobED25519PublicKey,
				message: Buffer.from('bob', 'utf-8'),
				signature: new Uint8Array([
					0x48, 0x13, 0x7d, 0x24, 0x44, 0x69, 0x64, 0x28, 0xbe, 0x12, 0x24, 0xa, 0xc8, 0x2e, 0x19, 0x9, 0xe9,
					0xba, 0xfc, 0xa8, 0x1, 0xed, 0x4a, 0xdc, 0x4d, 0x67, 0x5b, 0x66, 0xb7, 0xba, 0x8f, 0xd3, 0x72, 0xaf,
					0xe1, 0xbd, 0x8d, 0x77, 0x21, 0xe9, 0x27, 0xef, 0x2c, 0x19, 0xdc, 0xd, 0xa1, 0x28, 0x95, 0xd, 0xfe,
					0xd5, 0xde, 0x1e, 0xeb, 0xc2, 0x90, 0x71, 0xfc, 0xfe, 0x78, 0x31, 0xba, 0x2,
				]),
				expires: new Date('2022.02.01'),
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `incorrect-sig-ed25519-alice`,
			args: {
				key: AliceED25519PublicKey,
				message: Buffer.from('not-alice', 'utf-8'),
				signature: new Uint8Array([
					0xec, 0x2c, 0xf8, 0x51, 0x9b, 0x68, 0xc1, 0xe8, 0xf4, 0x2d, 0x10, 0xd3, 0xb9, 0xf4, 0x5a, 0x3f,
					0x4a, 0x51, 0x5a, 0xc1, 0xa0, 0x1d, 0x2e, 0x15, 0xd1, 0x44, 0x6b, 0x56, 0xf4, 0xa2, 0x9e, 0xd6,
					0xc9, 0x20, 0x43, 0x71, 0x6b, 0x80, 0xad, 0xe9, 0xe9, 0x2b, 0x1c, 0xee, 0xa4, 0xf8, 0x3e, 0x15,
					0x3e, 0xaf, 0x94, 0x2, 0xb6, 0x18, 0x53, 0x57, 0x23, 0x45, 0xe9, 0xc1, 0xb4, 0xa1, 0x6d, 0x2,
				]),
				expires: new Date('2022.01.01'),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `incorrect-sig-ed25519-bob`,
			args: {
				key: BobED25519PublicKey,
				message: Buffer.from('not-bob', 'utf-8'),
				signature: new Uint8Array([
					0x48, 0x13, 0x7d, 0x24, 0x44, 0x69, 0x64, 0x28, 0xbe, 0x12, 0x24, 0xa, 0xc8, 0x2e, 0x19, 0x9, 0xe9,
					0xba, 0xfc, 0xa8, 0x1, 0xed, 0x4a, 0xdc, 0x4d, 0x67, 0x5b, 0x66, 0xb7, 0xba, 0x8f, 0xd3, 0x72, 0xaf,
					0xe1, 0xbd, 0x8d, 0x77, 0x21, 0xe9, 0x27, 0xef, 0x2c, 0x19, 0xdc, 0xd, 0xa1, 0x28, 0x95, 0xd, 0xfe,
					0xd5, 0xde, 0x1e, 0xeb, 0xc2, 0x90, 0x71, 0xfc, 0xfe, 0x78, 0x31, 0xba, 0x2,
				]),
				expires: new Date('2022.02.01'),
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `unsupported-key`,
			args: {
				key: AliceSECP256K1PublicKey,
				message: Buffer.from('alice', 'utf-8'),
				signature: new Uint8Array([
					0xec, 0x2c, 0xf8, 0x51, 0x9b, 0x68, 0xc1, 0xe8, 0xf4, 0x2d, 0x10, 0xd3, 0xb9, 0xf4, 0x5a, 0x3f,
					0x4a, 0x51, 0x5a, 0xc1, 0xa0, 0x1d, 0x2e, 0x15, 0xd1, 0x44, 0x6b, 0x56, 0xf4, 0xa2, 0x9e, 0xd6,
					0xc9, 0x20, 0x43, 0x71, 0x6b, 0x80, 0xad, 0xe9, 0xe9, 0x2b, 0x1c, 0xee, 0xa4, 0xf8, 0x3e, 0x15,
					0x3e, 0xaf, 0x94, 0x2, 0xb6, 0x18, 0x53, 0x57, 0x23, 0x45, 0xe9, 0xc1, 0xb4, 0xa1, 0x6d, 0x2,
				]),
				expires: new Date('2022.01.01'),
			},
			expected: false,
			shouldThrow: new ErrorUnsupportedKey('secp256k1'),
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = verifyMailchainPasswordReset(
			test.args.key,
			test.args.signature,
			test.args.message,
			test.args.expires,
		);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.catch((e) => expect(e).toEqual(test.shouldThrow));
		}
		return target.then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('signMailchainPasswordReset()', () => {
	const tests = [
		{
			name: `ed25519-alice`,
			args: {
				key: AliceED25519PrivateKey,
				message: Buffer.from('alice', 'utf-8'),
				expires: new Date('2022.01.01'),
			},
			expected: new Uint8Array([
				0xec, 0x2c, 0xf8, 0x51, 0x9b, 0x68, 0xc1, 0xe8, 0xf4, 0x2d, 0x10, 0xd3, 0xb9, 0xf4, 0x5a, 0x3f, 0x4a,
				0x51, 0x5a, 0xc1, 0xa0, 0x1d, 0x2e, 0x15, 0xd1, 0x44, 0x6b, 0x56, 0xf4, 0xa2, 0x9e, 0xd6, 0xc9, 0x20,
				0x43, 0x71, 0x6b, 0x80, 0xad, 0xe9, 0xe9, 0x2b, 0x1c, 0xee, 0xa4, 0xf8, 0x3e, 0x15, 0x3e, 0xaf, 0x94,
				0x2, 0xb6, 0x18, 0x53, 0x57, 0x23, 0x45, 0xe9, 0xc1, 0xb4, 0xa1, 0x6d, 0x2,
			]),
			shouldThrow: false,
		},
		{
			name: `ed25519-bob`,
			args: {
				key: BobED25519PrivateKey,
				message: Buffer.from('bob', 'utf-8'),
				expires: new Date('2022.02.01'),
			},
			expected: new Uint8Array([
				0x48, 0x13, 0x7d, 0x24, 0x44, 0x69, 0x64, 0x28, 0xbe, 0x12, 0x24, 0xa, 0xc8, 0x2e, 0x19, 0x9, 0xe9,
				0xba, 0xfc, 0xa8, 0x1, 0xed, 0x4a, 0xdc, 0x4d, 0x67, 0x5b, 0x66, 0xb7, 0xba, 0x8f, 0xd3, 0x72, 0xaf,
				0xe1, 0xbd, 0x8d, 0x77, 0x21, 0xe9, 0x27, 0xef, 0x2c, 0x19, 0xdc, 0xd, 0xa1, 0x28, 0x95, 0xd, 0xfe,
				0xd5, 0xde, 0x1e, 0xeb, 0xc2, 0x90, 0x71, 0xfc, 0xfe, 0x78, 0x31, 0xba, 0x2,
			]),
			shouldThrow: false,
		},
		{
			name: `unsupported-key`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: Buffer.from('alice', 'utf-8'),
				expires: new Date('2022.02.01'),
			},
			expected: null,
			shouldThrow: new ErrorUnsupportedKey('secp256k1'),
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = signMailchainPasswordReset(test.args.key, test.args.message, test.args.expires);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.catch((e) => expect(e).toEqual(test.shouldThrow));
		}
		return target.then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
