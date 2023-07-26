import { decodeBase58, EncodingTypes, decodeHex, EncodingType, decodeUtf8 } from '@mailchain/encoding';
import { ProtocolType } from './protocols';
import { decodeAddressByProtocol, encodeAddressByProtocol, encodingByProtocol } from './encoding';

describe('EncodingByProtocol', () => {
	const tests = [
		{
			name: 'mailchain',
			args: {
				protocol: 'mailchain',
			},
			expected: EncodingTypes.Utf8,
		},
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
			name: 'near',
			args: {
				protocol: 'near',
			},
			expected: EncodingTypes.Utf8,
		},
		{
			name: 'tezos',
			args: {
				protocol: 'tezos',
			},
			expected: EncodingTypes.Base58,
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
			name: 'mailchain',
			args: {
				address: decodeUtf8('alice'),
				protocol: 'mailchain',
			},
			expected: {
				encoding: EncodingTypes.Utf8,
				encoded: 'alice',
			},
		},
		{
			name: 'mailchain with casing',
			args: {
				address: decodeUtf8('Alice'),
				protocol: 'mailchain',
			},
			expected: {
				encoding: EncodingTypes.Utf8,
				encoded: 'alice',
			},
		},
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
			name: 'near',
			args: {
				address: decodeUtf8('alice.near'),
				protocol: 'near',
			},
			expected: {
				encoding: EncodingTypes.Utf8,
				encoded: 'alice.near',
			},
		},
		{
			name: 'near with casing',
			args: {
				address: decodeUtf8('Alice.near'),
				protocol: 'near',
			},
			expected: {
				encoding: EncodingTypes.Utf8,
				encoded: 'alice.near',
			},
		},
		{
			name: 'tezos',
			args: {
				address: decodeBase58('tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV'),
				protocol: 'tezos',
			},
			expected: {
				encoding: EncodingTypes.Base58,
				encoded: 'tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV',
			},
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

describe('DecodeAddressByProtocol', () => {
	const tests: {
		name: string;
		args: Parameters<typeof decodeAddressByProtocol>;
		expected: { decoded: Uint8Array; encoding: EncodingType };
	}[] = [
		{
			name: 'mailchain',
			args: ['alice', 'mailchain'],
			expected: {
				decoded: decodeUtf8('alice'),
				encoding: EncodingTypes.Utf8,
			},
		},
		{
			name: 'mailchain with casing',
			args: ['Alice', 'mailchain'],
			expected: {
				decoded: decodeUtf8('alice'),
				encoding: EncodingTypes.Utf8,
			},
		},
		{
			name: 'ethereum',
			args: ['0x5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'ethereum'],
			expected: {
				decoded: decodeHex('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761'),
				encoding: EncodingTypes.Hex0xPrefix,
			},
		},
		{
			name: 'near',
			args: ['alice.near', 'near'],
			expected: {
				decoded: decodeUtf8('alice.near'),
				encoding: EncodingTypes.Utf8,
			},
		},
		{
			name: 'near with casing',
			args: ['Alice.near', 'near'],
			expected: {
				decoded: decodeUtf8('alice.near'),
				encoding: EncodingTypes.Utf8,
			},
		},
		{
			name: 'tezos',
			args: ['tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV', 'tezos'],
			expected: {
				decoded: decodeBase58('tz1cxdX7rUDr4G1LcHH2kVNLzEXBo7va15eV'),
				encoding: EncodingTypes.Base58,
			},
		},
	];

	test.each(tests)('$name', async (test) => {
		expect(decodeAddressByProtocol(test.args[0], test.args[1])).toEqual(test.expected);
	});
});
