import { chunkBuffer } from './chunk';

describe('chunkBuffer', () => {
	const tests = [
		{
			name: 'Uint8Array',
			input: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			size: 3,
			expected: [
				Buffer.from(new Uint8Array([0, 1, 2])),
				Buffer.from(new Uint8Array([3, 4, 5])),
				Buffer.from(new Uint8Array([6, 7, 8])),
				Buffer.from(new Uint8Array([9, 10])),
			],
			shouldThrow: false,
		},
		{
			name: 'Buffer',
			input: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			size: 3,
			expected: [
				Buffer.from(new Uint8Array([0, 1, 2])),
				Buffer.from(new Uint8Array([3, 4, 5])),
				Buffer.from(new Uint8Array([6, 7, 8])),
				Buffer.from(new Uint8Array([9, 10])),
			],
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = chunkBuffer;

		if (test.shouldThrow) {
			expect(() => {
				target(test.input, test.size);
			}).toThrow();
		} else {
			expect(target(test.input, test.size)).toEqual(test.expected);
		}
	});
});
