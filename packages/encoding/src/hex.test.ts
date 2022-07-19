import { DecodeHexZeroX, EncodeHexZeroX } from './hex';

describe('EncodeHexZeroX', () => {
	const tests = [
		{
			name: 'success',
			input: new Uint8Array([
				0x56, 0x2, 0xea, 0x95, 0x54, 0xb, 0xee, 0x46, 0xd0, 0x3b, 0xa3, 0x35, 0xee, 0xd6, 0xf4, 0x9d, 0x11,
				0x7e, 0xab, 0x95, 0xc8, 0xab, 0x8b, 0x71, 0xba, 0xe2, 0xcd, 0xd1, 0xe5, 0x64, 0xa7, 0x61,
			]),
			expected: '0x5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761',
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = EncodeHexZeroX;

		if (test.shouldThrow) {
			expect(() => {
				target(test.input);
			}).toThrow();
		} else {
			expect(target(test.input)).toEqual(test.expected);
		}
	});
});

describe('DecodeHexZeroX', () => {
	const tests = [
		{
			name: 'success',
			input: '0x5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761',
			expected: new Uint8Array([
				0x56, 0x2, 0xea, 0x95, 0x54, 0xb, 0xee, 0x46, 0xd0, 0x3b, 0xa3, 0x35, 0xee, 0xd6, 0xf4, 0x9d, 0x11,
				0x7e, 0xab, 0x95, 0xc8, 0xab, 0x8b, 0x71, 0xba, 0xe2, 0xcd, 0xd1, 0xe5, 0x64, 0xa7, 0x61,
			]),
			shouldThrow: false,
		},
		{
			name: 'err-missing-prefix',
			input: '5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761',
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = DecodeHexZeroX;

		if (test.shouldThrow) {
			expect(() => {
				target(test.input);
			}).toThrow();
		} else {
			expect(target(test.input)).toEqual(test.expected);
		}
	});
});
