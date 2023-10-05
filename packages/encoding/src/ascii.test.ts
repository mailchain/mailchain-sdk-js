import { decodeAscii, encodeAscii } from './ascii';

describe('encode ascii', () => {
	it('should decode ascii', () => {
		const input = 'Hello World!';
		const actual = decodeAscii(input);

		expect(actual).toEqual(
			Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21]),
		);
	});
	it('should encode ascii', () => {
		const input = Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21]);
		const actual = encodeAscii(input);
		expect(actual).toEqual('Hello World!');
	});

	it('should throw error when decoding non ascii', () => {
		const input = 'Здраво Свету!';
		expect(() => decodeAscii(input)).toThrowError('Input is not ASCII');
	});
});
