import { DecodeHex } from '@mailchain/encoding';
import { defaultScryptParams, deriveSecretFromScrypt } from './scrypt';

describe('deriveSecretFromScrypt()', () => {
	const tests = [
		{
			name: `passphrase-no-salt`,
			args: {
				passphrase: 'passphrase',
				params: defaultScryptParams,
				salt: new Uint8Array([]),
			},
			expected: {
				secret: new Uint8Array([
					0x14, 0x64, 0xbb, 0x68, 0x5d, 0xd1, 0x6a, 0xef, 0xe9, 0x1a, 0xe1, 0x34, 0x6d, 0x3d, 0x9a, 0x60, 0x2,
					0x43, 0x1a, 0x5a, 0x1b, 0xc2, 0xde, 0xa6, 0x23, 0x35, 0xef, 0xc8, 0xad, 0x1f, 0x60, 0x1b,
				]),
				salt: new Uint8Array([]),
				params: defaultScryptParams,
			},
			shouldThrow: false,
		},
		{
			name: `no-passphrase-no-salt`,
			args: {
				passphrase: '',
				params: defaultScryptParams,
				salt: new Uint8Array([]),
			},
			expected: {
				secret: new Uint8Array([
					0xae, 0x51, 0xe1, 0x6a, 0x25, 0x28, 0x52, 0x2f, 0x1c, 0x61, 0x85, 0xcc, 0xed, 0xb4, 0xba, 0xb, 0x96,
					0xbc, 0x3, 0x32, 0x86, 0x17, 0x2, 0x65, 0x9d, 0x26, 0xf2, 0x6c, 0x54, 0x83, 0xc2, 0xe6,
				]),
				salt: new Uint8Array([]),
				params: defaultScryptParams,
			},
			shouldThrow: false,
		},
		{
			name: `passphrase-salt`,
			args: {
				passphrase: 'passphrase',
				params: defaultScryptParams,
				salt: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
			},
			expected: {
				secret: DecodeHex('f49a56ea442c3d1d3faaecabf6d8632226c7d8d0042bcf82a37801ba07ba511e'),
				salt: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
				params: defaultScryptParams,
			},
			shouldThrow: false,
		},
		{
			name: `no-passphrase-salt`,
			args: {
				passphrase: '',
				params: defaultScryptParams,
				salt: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
			},
			expected: {
				secret: DecodeHex('e3760954d3582d597e2a05118d178f6f72866a0e27c8bbd58cf1d1aa266bc925'),
				salt: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
				params: defaultScryptParams,
			},
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const actual = deriveSecretFromScrypt(test.args.passphrase, test.args.params, test.args.salt);
			expect(actual).toEqual(test.expected);
		});
	});
	it('with-random-salt', () => {
		const key1 = deriveSecretFromScrypt('passphrase', defaultScryptParams);
		const key2 = deriveSecretFromScrypt('passphrase', defaultScryptParams);
		expect(key1).not.toEqual(key2);
	});
});
