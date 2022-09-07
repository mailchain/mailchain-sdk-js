import { fromEntropy, toEntropy, toSeed } from './mnemonic';

describe('toEntropy()', () => {
	const tests = [
		{
			name: 'deputy other',
			arg: 'deputy other grain consider empty next inform myself combine dish parent maple priority outdoor inherit lonely battle add humble jar silly tank item balance',
			expected: Uint8Array.from([
				59, 83, 161, 150, 23, 164, 147, 42, 156, 228, 146, 45, 231, 230, 128, 195, 202, 175, 58, 92, 244, 29,
				19, 64, 101, 187, 187, 172, 139, 187, 93, 176,
			]),
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: 'invalid',
			expected: Uint8Array.from([]),
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				toEntropy(test.arg);
			}).toThrow();
		} else {
			expect(toEntropy(test.arg)).toEqual(test.expected);
		}
	});
});

describe('toEntropy()', () => {
	const tests = [
		{
			name: 'deputy other',
			arg: Uint8Array.from([
				59, 83, 161, 150, 23, 164, 147, 42, 156, 228, 146, 45, 231, 230, 128, 195, 202, 175, 58, 92, 244, 29,
				19, 64, 101, 187, 187, 172, 139, 187, 93, 176,
			]),
			expected:
				'deputy other grain consider empty next inform myself combine dish parent maple priority outdoor inherit lonely battle add humble jar silly tank item balance',
			shouldThrow: false,
		},
		{
			name: 'invalid',
			arg: Uint8Array.from([]),
			expected: 'invalid',
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				fromEntropy(test.arg);
			}).toThrow();
		} else {
			expect(fromEntropy(test.arg)).toEqual(test.expected);
		}
	});
});

describe('toSeed()', () => {
	const tests = [
		{
			name: 'deputy other',
			args: {
				phrase: 'deputy other grain consider empty next inform myself combine dish parent maple priority outdoor inherit lonely battle add humble jar silly tank item balance',
			},
			expected: Uint8Array.from([
				196, 61, 147, 66, 207, 131, 22, 179, 98, 3, 83, 23, 116, 171, 96, 65, 14, 243, 147, 40, 21, 137, 42,
				185, 147, 169, 115, 33, 38, 53, 82, 88,
			]),
			shouldThrow: false,
		},
		{
			name: 'invalid',
			args: {
				phrase: 'invalid',
			},
			expected: Uint8Array.from([]),
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				toSeed(test.args.phrase);
			}).toThrow();
		} else {
			const actual = toSeed(test.args.phrase);
			expect(actual).toEqual(test.expected);
			expect(actual).toHaveLength(32);
		}
	});
});
