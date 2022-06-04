import { DecodeBase58 } from '@mailchain/encoding/base58';
import { EncodingTypes } from '@mailchain/encoding/consts';
import { DecodeHex } from '@mailchain/encoding/hex';
import { EncodeAddressByProtocol, EncodingByProtocol } from './encoding';

describe('EncodingByProtocol', () => {
	const tests = [
		{
			name: 'algorand',
			args: {
				protocol: 'algorand',
			},
			expected: EncodingTypes.Base32,
			shouldThrow: false,
		},
		{
			name: 'ethereum',
			args: {
				protocol: 'ethereum',
			},
			expected: EncodingTypes.Hex0xPrefix,
			shouldThrow: false,
		},
		{
			name: 'substrate',
			args: {
				protocol: 'substrate',
			},
			expected: EncodingTypes.Base58,
			shouldThrow: false,
		},
		{
			name: 'invalid',
			args: {
				protocol: 'invalid',
			},
			expected: '',
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					EncodingByProtocol(test.args.protocol);
				}).toThrow();
			} else {
				expect(EncodingByProtocol(test.args.protocol)).toEqual(test.expected);
			}
		});
	});
});

describe('EncodeAddressByProtocol', () => {
	const tests = [
		{
			name: 'ethereum',
			args: {
				address: DecodeHex('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761'),
				protocol: 'ethereum',
			},
			expected: {
				encoding: EncodingTypes.Hex0xPrefix,
				encoded: '0x5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761',
			},
			shouldThrow: false,
		},
		{
			name: 'substrate',
			args: {
				address: DecodeBase58('5DJJhV3tVzsWG1jZfL157azn8iRyDC7HyNG1yh8v2nQYd994'),
				protocol: 'substrate',
			},
			expected: {
				encoding: EncodingTypes.Base58,
				encoded: '5DJJhV3tVzsWG1jZfL157azn8iRyDC7HyNG1yh8v2nQYd994',
			},
			shouldThrow: false,
		},
		{
			name: 'unknown-protocol',
			args: {
				address: DecodeBase58('5DJJhV3tVzsWG1jZfL157azn8iRyDC7HyNG1yh8v2nQYd994'),
				protocol: 'unknown',
			},
			expected: {
				encoding: '',
				encoded: '',
			},
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					EncodeAddressByProtocol(test.args.address, test.args.protocol);
				}).toThrow();
			} else {
				expect(EncodeAddressByProtocol(test.args.address, test.args.protocol)).toEqual(test.expected);
			}
		});
	});
});
