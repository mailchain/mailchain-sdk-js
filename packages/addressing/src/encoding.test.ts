import { decodeBase58 } from '@mailchain/encoding/base58';
import { EncodingTypes } from '@mailchain/encoding';
import { decodeHex } from '@mailchain/encoding/hex';
import { ProtocolType } from './protocols';
import { encodeAddressByProtocol, encodingByProtocol } from './encoding';

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
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				encodingByProtocol(test.args.protocol as ProtocolType);
			}).toThrow();
		} else {
			expect(encodingByProtocol(test.args.protocol as ProtocolType)).toEqual(test.expected);
		}
	});
});

describe('EncodeAddressByProtocol', () => {
	const tests = [
		{
			name: 'ethereum',
			args: {
				address: decodeHex('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761'),
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
				address: decodeBase58('5DJJhV3tVzsWG1jZfL157azn8iRyDC7HyNG1yh8v2nQYd994'),
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
				address: decodeBase58('5DJJhV3tVzsWG1jZfL157azn8iRyDC7HyNG1yh8v2nQYd994'),
				protocol: 'unknown',
			},
			expected: {
				encoding: '',
				encoded: '',
			},
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				encodeAddressByProtocol(test.args.address, test.args.protocol as ProtocolType);
			}).toThrow();
		} else {
			expect(encodeAddressByProtocol(test.args.address, test.args.protocol as ProtocolType)).toEqual(
				test.expected,
			);
		}
	});
});