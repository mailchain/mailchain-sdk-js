import { decodeUtf8, encodeUtf8 } from './utf8';
describe('Buffer', () => {
	it('Encode and decode are the same', () => {
		const arr = new Uint8Array(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 127, 125, 0, 1]));
		expect(decodeUtf8(encodeUtf8(arr))).toEqual(arr);
	});
	it('Encode and decode should not be the same because of utf8 sequnce is not valid', () => {
		const arr = new Uint8Array(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 140, 125, 0, 1]));
		expect(decodeUtf8(encodeUtf8(arr))).not.toEqual(arr);
	});
});

describe('Decode', () => {
	const tests = [
		{
			input: "'😲🥳😲🥳🙂1323'",
			expected: Uint8Array.from([
				0x27, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3,
				0xf0, 0x9f, 0x99, 0x82, 0x31, 0x33, 0x32, 0x33, 0x27,
			]),
		},
	];

	test.each(tests)('$name', async (test) => {
		expect(decodeUtf8(test.input)).toEqual(test.expected);
	});
});

describe('Encode', () => {
	const tests = [
		{
			input: Uint8Array.from([
				0x27, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3, 0xf0, 0x9f, 0x98, 0xb2, 0xf0, 0x9f, 0xa5, 0xb3,
				0xf0, 0x9f, 0x99, 0x82, 0x31, 0x33, 0x32, 0x33, 0x27,
			]),
			expected: "'😲🥳😲🥳🙂1323'",
		},
	];

	test.each(tests)('$name', async (test) => {
		expect(encodeUtf8(test.input)).toEqual(test.expected);
	});
});
