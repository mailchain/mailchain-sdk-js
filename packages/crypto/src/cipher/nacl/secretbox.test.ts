import { RandomFunction } from '../../rand';
import { easySeal, easyOpen } from './secretbox';

describe('easy-seal', () => {
	const tests = [
		{
			name: 'success-2e322f...',
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			secretKey: new Uint8Array([
				0x2e, 0x32, 0x2f, 0x87, 0x40, 0xc6, 0x1, 0x72, 0x11, 0x1a, 0xc8, 0xea, 0xdc, 0xdd, 0xa2, 0x51, 0x2f,
				0x90, 0xd0, 0x6d, 0xe, 0x50, 0x3e, 0xf1, 0x89, 0x97, 0x9a, 0x15, 0x9b, 0xec, 0xe1, 0xe8,
			]),
			rand: (): Uint8Array => {
				return new Uint8Array([
					65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
				]);
			},
			expected: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x5b, 0x19, 0x83, 0xe5, 0x6e, 0x7f, 0xed, 0xfe, 0xbb, 0xd0,
				0x70, 0x34, 0xce, 0x25, 0x49, 0x76, 0xa3, 0x50, 0x78, 0x91, 0x18, 0xe6, 0xe3,
			]),
			shouldThrow: false,
		},
		{
			name: 'success-169a11...',
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			secretKey: new Uint8Array([
				0x16, 0x9a, 0x11, 0x72, 0x18, 0x51, 0xf5, 0xdf, 0xf3, 0x54, 0x1d, 0xd5, 0xc4, 0xb0, 0xb4, 0x78, 0xac,
				0x1c, 0xd0, 0x92, 0xc9, 0xd5, 0x97, 0x6e, 0x83, 0xda, 0xa0, 0xd0, 0x3f, 0x26, 0x62, 0xc,
			]),
			rand: (): Uint8Array => {
				return new Uint8Array([
					65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
				]);
			},
			expected: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0xa3, 0x81, 0x27, 0x6f, 0xdb, 0x97, 0x17, 0x51, 0x10, 0x1e,
				0x17, 0x2c, 0xec, 0x5b, 0xae, 0xdc, 0x7, 0x26, 0xea, 0x16, 0xe4, 0xc7, 0xde,
			]),
			shouldThrow: false,
		},
		{
			name: 'success-84623e...',
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			secretKey: new Uint8Array([
				0x84, 0x62, 0x3e, 0x72, 0x52, 0xe4, 0x11, 0x38, 0xaf, 0x69, 0x4, 0xe1, 0xb0, 0x23, 0x4, 0xc9, 0x41,
				0x62, 0x5f, 0x39, 0xe5, 0x76, 0x25, 0x89, 0x12, 0x5d, 0xc1, 0xa2, 0xf2, 0xcf, 0x2e, 0x30,
			]),
			rand: (): Uint8Array => {
				return new Uint8Array([
					65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
				]);
			},
			expected: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x6, 0x3e, 0xa1, 0x2c, 0xa5, 0x8e, 0x6b, 0x36, 0x98, 0xf8,
				0x0, 0x56, 0x74, 0xfe, 0x32, 0x9a, 0x3e, 0x60, 0xf1, 0x1b, 0x53, 0x6d, 0x77,
			]),
			shouldThrow: false,
		},
		{
			name: 'err-secret-key',
			message: new Uint8Array(Buffer.from('message', 'ascii')),
			secretKey: new Uint8Array([]),
			rand: (): Uint8Array => {
				return new Uint8Array([
					65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
				]);
			},
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = easySeal;

		if (test.shouldThrow) {
			expect(() => {
				target(test.message, test.secretKey, test.rand as RandomFunction);
			}).toThrow();
		} else {
			expect(target(test.message, test.secretKey, test.rand as RandomFunction)).toEqual(test.expected);
		}
	});
});

describe('easy-open', () => {
	const tests = [
		{
			name: 'success-2e322f...',
			sealedBox: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x5b, 0x19, 0x83, 0xe5, 0x6e, 0x7f, 0xed, 0xfe, 0xbb, 0xd0,
				0x70, 0x34, 0xce, 0x25, 0x49, 0x76, 0xa3, 0x50, 0x78, 0x91, 0x18, 0xe6, 0xe3,
			]),
			secretKey: new Uint8Array([
				0x2e, 0x32, 0x2f, 0x87, 0x40, 0xc6, 0x1, 0x72, 0x11, 0x1a, 0xc8, 0xea, 0xdc, 0xdd, 0xa2, 0x51, 0x2f,
				0x90, 0xd0, 0x6d, 0xe, 0x50, 0x3e, 0xf1, 0x89, 0x97, 0x9a, 0x15, 0x9b, 0xec, 0xe1, 0xe8,
			]),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'success-169a11...',
			sealedBox: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0xa3, 0x81, 0x27, 0x6f, 0xdb, 0x97, 0x17, 0x51, 0x10, 0x1e,
				0x17, 0x2c, 0xec, 0x5b, 0xae, 0xdc, 0x7, 0x26, 0xea, 0x16, 0xe4, 0xc7, 0xde,
			]),
			secretKey: new Uint8Array([
				0x16, 0x9a, 0x11, 0x72, 0x18, 0x51, 0xf5, 0xdf, 0xf3, 0x54, 0x1d, 0xd5, 0xc4, 0xb0, 0xb4, 0x78, 0xac,
				0x1c, 0xd0, 0x92, 0xc9, 0xd5, 0x97, 0x6e, 0x83, 0xda, 0xa0, 0xd0, 0x3f, 0x26, 0x62, 0xc,
			]),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'success-84623e...',
			sealedBox: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x6, 0x3e, 0xa1, 0x2c, 0xa5, 0x8e, 0x6b, 0x36, 0x98, 0xf8,
				0x0, 0x56, 0x74, 0xfe, 0x32, 0x9a, 0x3e, 0x60, 0xf1, 0x1b, 0x53, 0x6d, 0x77,
			]),
			secretKey: new Uint8Array([
				0x84, 0x62, 0x3e, 0x72, 0x52, 0xe4, 0x11, 0x38, 0xaf, 0x69, 0x4, 0xe1, 0xb0, 0x23, 0x4, 0xc9, 0x41,
				0x62, 0x5f, 0x39, 0xe5, 0x76, 0x25, 0x89, 0x12, 0x5d, 0xc1, 0xa2, 0xf2, 0xcf, 0x2e, 0x30,
			]),
			expected: new Uint8Array(Buffer.from('message', 'ascii')),
			shouldThrow: false,
		},
		{
			name: 'err-secret-key',
			sealedBox: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x6, 0x3e, 0xa1, 0x2c, 0xa5, 0x8e, 0x6b, 0x36, 0x98, 0xf8,
				0x0, 0x56, 0x74, 0xfe, 0x32, 0x9a, 0x3e, 0x60, 0xf1, 0x1b, 0x53, 0x6d, 0x77,
			]),
			secretKey: new Uint8Array([]),
			expected: null,
			shouldThrow: true,
		},
		{
			name: 'err-nonce-size',
			sealedBox: new Uint8Array([0x41, 0x42, 0x43, 0x44]),
			secretKey: new Uint8Array([]),
			expected: null,
			shouldThrow: true,
		},
		{
			name: 'err-wrong-key',
			sealedBox: new Uint8Array([
				0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51,
				0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x6, 0x3e, 0xa1, 0x2c, 0xa5, 0x8e, 0x6b, 0x36, 0x98, 0xf8,
				0x0, 0x56, 0x74, 0xfe, 0x32, 0x9a, 0x3e, 0x60, 0xf1, 0x1b, 0x53, 0x6d, 0x77,
			]),
			secretKey: new Uint8Array([
				0x2e, 0x32, 0x2f, 0x87, 0x40, 0xc6, 0x1, 0x72, 0x11, 0x1a, 0xc8, 0xea, 0xdc, 0xdd, 0xa2, 0x51, 0x2f,
				0x90, 0xd0, 0x6d, 0xe, 0x50, 0x3e, 0xf1, 0x89, 0x97, 0x9a, 0x15, 0x9b, 0xec, 0xe1, 0xe8,
			]),
			expected: null,
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = easyOpen;

		if (test.shouldThrow) {
			expect(() => {
				target(test.sealedBox, test.secretKey);
			}).toThrow();
		} else {
			expect(target(test.sealedBox, test.secretKey)).toEqual(test.expected);
		}
	});
});
