import { DecodeHexZeroX } from '@mailchain/encoding';
import { AliceED25519PrivateKey, BobED25519PrivateKey } from './test.const';
import { DeriveHardenedKey, ED25519ExtendedPrivateKey, ED25519PrivateKey } from '.';

describe('Derive()', () => {
	const tests = [
		{
			name: `alice://0`,
			args: {
				key: AliceED25519PrivateKey,
				path: [0],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0x860feceae0ebccf975cc85092a38ae24e4674e55d3d6aa707a18de71358ccc33'),
			),
			shouldThrow: false,
		},
		{
			name: `alice://1`,
			args: {
				key: AliceED25519PrivateKey,
				path: [1],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0x729b9cbc57779d707d587e5f860a7cd3db8804ae39f755cd0036fda853da2139'),
			),
			shouldThrow: false,
		},
		{
			name: `alice://1//2`,
			args: {
				key: AliceED25519PrivateKey,
				path: [1, 2],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0xed9ab0b26b9a3e6d48d55030ba15ec66823fe7d12ca8fad690a8d4bc9b9488cc'),
			),
			shouldThrow: false,
		},
		{
			name: `alice//1://2`,
			args: {
				key: ED25519PrivateKey.FromSeed(
					DecodeHexZeroX('0x729b9cbc57779d707d587e5f860a7cd3db8804ae39f755cd0036fda853da2139'),
				),
				path: [2],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0xed9ab0b26b9a3e6d48d55030ba15ec66823fe7d12ca8fad690a8d4bc9b9488cc'),
			),
			shouldThrow: false,
		},
		{
			name: `bob://0`,
			args: {
				key: BobED25519PrivateKey,
				path: [0],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0xccd684257e55f16dd50eea4e52bd04843716e13295a542a143a09792c419191c'),
			),
			shouldThrow: false,
		},
		{
			name: `bob://1`,
			args: {
				key: BobED25519PrivateKey,
				path: [1],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0x76f7e8aa3e95bfc13d4ab8b59f6bd82ad3621449fbb66c123cc9c310c7d8d286'),
			),
			shouldThrow: false,
		},
		{
			name: `bob://1//2`,
			args: {
				key: BobED25519PrivateKey,
				path: [1, 2],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0xd2c0014e75ccce7b3319f5be5f494e9af56b9596fb7546af0eaef4a9c7caecc3'),
			),
			shouldThrow: false,
		},
		{
			name: `bob//1://2`,
			args: {
				key: ED25519PrivateKey.FromSeed(
					DecodeHexZeroX('0x76f7e8aa3e95bfc13d4ab8b59f6bd82ad3621449fbb66c123cc9c310c7d8d286'),
				),
				path: [2],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0xd2c0014e75ccce7b3319f5be5f494e9af56b9596fb7546af0eaef4a9c7caecc3'),
			),
			shouldThrow: false,
		},
		{
			name: `bob//test.string`,
			args: {
				key: BobED25519PrivateKey,
				path: ['test.string'],
			},
			expected: ED25519PrivateKey.FromSeed(
				DecodeHexZeroX('0x8a4f41889ae03047e2427ec156be5505fa64374007a70aa4ee191c7a76f8e3a4'),
			),
			shouldThrow: false,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			let extendedKey = ED25519ExtendedPrivateKey.FromPrivateKey(test.args.key);

			for (const path of test.args.path) {
				extendedKey = DeriveHardenedKey(extendedKey, path);
			}
			const { Sign, ...expected } = test.expected!;

			expect(extendedKey.PrivateKey).toEqual(expect.objectContaining(expected));
		});
	});
});
