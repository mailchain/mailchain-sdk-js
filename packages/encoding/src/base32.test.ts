import { decodeBase32, encodeBase32 } from './base32';
describe('Buffer', () => {
	it('Encode and decode are the same', () => {
		const arr = new Uint8Array(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 127, 125, 0, 1]));
		expect(decodeBase32(encodeBase32(arr))).toEqual(arr);
	});
});

describe('DecodeBase32', () => {
	const tests = [
		{
			input: 'e7yj7gfs6cp2lm7qt6mlf4e7uwz7bh4zqiytgmrte4',
			expected: Uint8Array.from([
				0x27, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3,
				0xf0, 0x9f, 0x99, 0x82, 0x31, 0x33, 0x32, 0x33, 0x27,
			]),
		},
		{
			input: 'me',
			expected: Uint8Array.from([0x61]),
		},
		{
			input: 'jbswy3dp',
			expected: Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
		},
	];

	test.each(tests)('$name', async (test) => {
		expect(decodeBase32(test.input)).toEqual(test.expected);
	});
});

describe('EncodeBase32', () => {
	const tests = [
		{
			input: Uint8Array.from([
				0x27, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3,
				0xf0, 0x9f, 0x99, 0x82, 0x31, 0x33, 0x32, 0x33, 0x27,
			]),
			expected: 'e7yj7gfs6cp2lm7qt6mlf4e7uwz7bh4zqiytgmrte4',
		},
		{
			input: Uint8Array.from([0x61]),
			expected: 'me',
		},
		{
			input: Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
			expected: 'jbswy3dp',
		},
	];

	test.each(tests)('$name', async (test) => {
		expect(encodeBase32(test.input)).toEqual(test.expected);
	});
});
