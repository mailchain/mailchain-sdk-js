import { decodeBase64, encodeBase64 } from './base64';

describe('test unicde characters encoded properly', () => {
	test('chinese', () => {
		expect(Buffer.from(decodeBase64(encodeBase64(Buffer.from('我你')))).toString()).toEqual('我你');
	});
	test('cyrillic', () => {
		expect(Buffer.from(decodeBase64(encodeBase64(Buffer.from('привет всем')))).toString()).toEqual('привет всем');
	});
	test('emoji', () => {
		expect(Buffer.from(decodeBase64(encodeBase64(Buffer.from('😀😀😀')))).toString()).toEqual('😀😀😀');
	});
});
