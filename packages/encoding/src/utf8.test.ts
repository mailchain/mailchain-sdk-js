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
