import { decodeHexZeroX } from '@mailchain/encoding';
import { AliceSR25519PrivateKey, BobSR25519PrivateKey } from './test.const';
import { sr25519DeriveHardenedKey, SR25519ExtendedPrivateKey, SR25519PrivateKey } from '.';

describe('Derive()', () => {
	const tests = [
		{
			name: `alice://0`,
			args: {
				key: AliceSR25519PrivateKey,
				path: [0],
			},
			expectedSeed: decodeHexZeroX('0xccb73e05adf8866d1a4dcd76e1f53db3b89850232a990cf1e9481ba686149f9f'),
			shouldThrow: false,
		},
		{
			name: `alice://1`,
			args: {
				key: AliceSR25519PrivateKey,
				path: [1],
			},
			expectedSeed: decodeHexZeroX('0x3bda43f87952aed76127e7c632e474ae43e72d9a8bb0208a30e30f6ba514d5b5'),
			shouldThrow: false,
		},
		{
			name: `alice://1//2`,
			args: {
				key: AliceSR25519PrivateKey,
				path: [1, 2],
			},
			expectedSeed: decodeHexZeroX('0x8b0e37335e557cd265cd5328e7f56c4f5e156ee0efac847ae2d900700b0fa6e3'),
			shouldThrow: false,
		},
		{
			name: `alice//1://2`,
			args: {
				key: SR25519PrivateKey.fromSeed(
					decodeHexZeroX('0x3bda43f87952aed76127e7c632e474ae43e72d9a8bb0208a30e30f6ba514d5b5'),
				),
				path: [2],
			},
			expectedSeed: decodeHexZeroX('0x8b0e37335e557cd265cd5328e7f56c4f5e156ee0efac847ae2d900700b0fa6e3'),
			shouldThrow: false,
		},
		{
			name: `bob://0`,
			args: {
				key: BobSR25519PrivateKey,
				path: [0],
			},
			expectedSeed: decodeHexZeroX('0x24934cfc19bbd809604598d0382c1a0bc13a0962b1bf8298af94cd9b858c7871'),
			shouldThrow: false,
		},
		{
			name: `bob://1`,
			args: {
				key: BobSR25519PrivateKey,
				path: [1],
			},
			expectedSeed: decodeHexZeroX('0xc2f23fb4aa97ce791ed1c51ea701077a7d0d10c3281be9c47b3a221551fce143'),
			shouldThrow: false,
		},
		{
			name: `bob://1//2`,
			args: {
				key: BobSR25519PrivateKey,
				path: [1, 2],
			},
			expectedSeed: decodeHexZeroX('0xc5293b4667b873914a5cbc350b398e5196fb50ece9c4765e0927fc8649978f90'),
			shouldThrow: false,
		},
		{
			name: `bob//1://2`,
			args: {
				key: SR25519PrivateKey.fromSeed(
					decodeHexZeroX('0xc2f23fb4aa97ce791ed1c51ea701077a7d0d10c3281be9c47b3a221551fce143'),
				),
				path: [2],
			},
			expectedSeed: decodeHexZeroX('0xc5293b4667b873914a5cbc350b398e5196fb50ece9c4765e0927fc8649978f90'),
			shouldThrow: false,
		},
	];
	test.each(tests)('$name', async (test) => {
		let extendedKey = SR25519ExtendedPrivateKey.fromPrivateKey(await test.args.key);

		for (const path of test.args.path) {
			extendedKey = await sr25519DeriveHardenedKey(extendedKey, path);
		}

		expect(extendedKey.privateKey).toEqual(await SR25519PrivateKey.fromSeed(test.expectedSeed));
	});
});
