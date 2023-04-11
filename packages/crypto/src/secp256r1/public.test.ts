import { decodeHex, decodeUtf8 } from '@mailchain/encoding';
import { blake2AsU8a } from '@polkadot/util-crypto';
import {
	BobSECP256R1PrivateKey,
	BobSECP256R1PublicKey,
	CarlosSECP256R1PrivateKey,
	CarlosSECP256R1PublicKey,
	AliceSECP256R1PrivateKey,
	AliceSECP256R1PublicKey,
	CarolSECP256R1PublicKey,
} from './test.const';

describe('verify()', () => {
	const tests = [
		{
			name: 'BobSECP256R1 verify',
			privKey: BobSECP256R1PrivateKey,
			message: decodeUtf8('hello from mailchain'),
			expected: true,
		},
		{
			name: 'CarlosSECP256R1 verify',
			privKey: CarlosSECP256R1PrivateKey,
			message: decodeUtf8('hello from mailchain'),
			expected: true,
		},
		{
			name: 'AliceSECP256R1 verify',
			privKey: AliceSECP256R1PrivateKey,
			message: decodeUtf8('hello from mailchain'),
			expected: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const bytesHash = blake2AsU8a(test.message, 256);
		const sig = await test.privKey.sign(bytesHash);
		return test.privKey.publicKey.verify(bytesHash, sig).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('verifySignature()', () => {
	const tests = [
		{
			name: 'AliceSECP256R1',
			pubKey: AliceSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'3eb824015c1d13541ff6b6a5af1e64a7aa1d2e5fdc17c935a37d766616c307634eb97a751000158a88118f8ccfd43e9dd0eece2dcbdc0368b365fb8d51bf1d6c',
			),
			expected: true,
		},
		{
			name: 'AliceSECP256R1 - go compatibility',
			pubKey: AliceSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'ba1618aca63b24376e6f538beee4f757523081306ed10f301ada1a5919a5b68d526b2ae2f1cd8fd6985c42dd0fe681dc1d7e2ea091bc0c2e524de6d65f2c7318',
			),
			expected: true,
		},
		{
			name: 'BobSECP256R1 verify - go compatibility',
			pubKey: BobSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'f3c5e4a924b18264c166d74f3210a1fbc42dd4d93b0d1b0f6a96ef6584ae31905d698badee1399287f4c3f49bca4a690a19ef95ce620aecc862cc1e4f8d0cdf1',
			),
			expected: true,
		},
		{
			name: 'CarlosSECP256R1',
			pubKey: CarlosSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'5dc9a3c61e34a77ce1ced6ef6114856eab46685824acbe3fdc5e0f502eb61ffb28d62a8cdc326374de6beb29da4d79f62f148af4d5f5fa24e81e82e812e05294',
			),
			expected: true,
		},
		{
			name: 'BobSECP256R1 verify - go compatibility',
			pubKey: BobSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'de5db37e848e34fc4a9999410969edb4ed20676a7209754968bbcf289ac2efc23fabad06e7fa69bbb01f5de0b9f6e19d95fd1f2ab5c03687ae6c83ab965e6787',
			),
			expected: true,
		},
		{
			name: 'CarlosSECP256R1',
			pubKey: CarlosSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'8a7b2047bbb834a21f32ff5d1082c6810cdefbb4c7c28a037e59711866b2134306066ef68e9ec2f42b544736003771c21e318649274e1c10b766e032a9f3bdc2',
			),
			expected: true,
		},
		{
			name: 'CarlosSECP256R1 - go compatibility',
			pubKey: CarlosSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'd6be4b13413fe3c1ca7562140a52ad14465f81d7a1ebc5eb74e3e5ef22126dfc25046c25ad5a09a67754161aed356a99a4b034e71aec36d714199c9e37485f56',
			),
			expected: true,
		},
		{
			name: 'CarolSECP256R1',
			pubKey: CarolSECP256R1PublicKey,
			message: decodeUtf8('hello from mailchain'),
			signature: decodeHex(
				'679f4cd02fc44e62ce1319581d3ef30124b9b7e666d78afbda3bfad1956058563bfe9c84f9a44179723fb4ec81d91edd2a16bdb1c73d3aa4d19fc81f942561fe',
			),
			expected: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		const bytesHash = blake2AsU8a(test.message, 256);
		return test.pubKey.verify(bytesHash, test.signature).then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
