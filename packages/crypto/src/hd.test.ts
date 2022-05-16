import { DecodeHex } from '@mailchain/encoding/hex';
import { ChainCodeFromDeriveIndex } from './hd';

describe('ChainCodeFromDeriveIndex()', () => {
	const tests = [
		{
			name: `0`,
			index: 0,
			expected: DecodeHex('0000000000000000000000000000000000000000000000000000000000000000'),
		},
		{
			name: `short-string`,
			index: 'short-string',
			expected: DecodeHex('3073686f72742d737472696e6700000000000000000000000000000000000000'),
		},
		{
			name: `long-string`,
			index: 'string longer than chain code length of 32 bytes',
			expected: DecodeHex('79a03475da2fcd8d43e22be1f0f15946f171571506008baa381fecc84373ddea'),
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			const actual = ChainCodeFromDeriveIndex(test.index);
			expect(actual).toEqual(test.expected);
		});
	});
});
