import { decodeHex } from '@mailchain/encoding';
import { chainCodeFromDeriveIndex } from './hd';

describe('ChainCodeFromDeriveIndex()', () => {
	const tests = [
		{
			name: `0`,
			index: 0,
			expected: decodeHex('0000000000000000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `10`,
			index: 10,
			expected: decodeHex('0a00000000000000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `1000`,
			index: 1000,
			expected: decodeHex('e803000000000000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `16-FF`,
			index: decodeHex('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
			expected: decodeHex('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000'),
		},
		{
			name: `32-FF`,
			index: decodeHex('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
			expected: decodeHex('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
		},
		{
			name: `64-FF`,
			index: decodeHex(
				'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
			),
			expected: decodeHex('41db096e15f03b135b04e99e848e0f76cb3739c35ffe07e3679df37867bcb573'),
		},
		{
			name: `short`,
			index: 'short',
			expected: decodeHex('1473686f72740000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `hex-string`,
			index: '0x1234abcd',
			expected: decodeHex('1234abcd00000000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `short-string`,
			index: 'short-string',
			expected: decodeHex('3073686f72742d737472696e6700000000000000000000000000000000000000'),
		},
		{
			name: `long-string`,
			index: 'string longer than chain code length of 32 bytes',
			expected: decodeHex('79a03475da2fcd8d43e22be1f0f15946f171571506008baa381fecc84373ddea'),
		},
	];
	test.each(tests)('$name', async (test) => {
		const actual = chainCodeFromDeriveIndex(test.index);
		expect(actual).toEqual(test.expected);
	});
});
