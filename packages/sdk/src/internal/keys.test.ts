import { AliceED25519PrivateKey, AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PrivateKey, AliceSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSECP256R1PublicKey } from '@mailchain/crypto/secp256r1/test.const';
import {
	privateMessagingKeyFromHex,
	privateMessagingKeyToHex,
	publicMessagingKeyFromHex,
	publicMessagingKeyToHex,
} from './keys';

describe('publicMessagingKey()', () => {
	const tests = [
		{
			name: 'ed25519 alice',
			arg: AliceED25519PublicKey,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PublicKey,
		},
		{
			name: 'secp256r1 alice',
			arg: AliceSECP256R1PublicKey,
		},
	];
	test.each(tests)('$name', async (test) => {
		const hex = publicMessagingKeyToHex(test.arg);
		expect(publicMessagingKeyFromHex(hex)).toEqual(test.arg);
	});
});

describe('privateMessagingKey()', () => {
	const tests = [
		{
			name: 'ed25519 alice',
			arg: AliceED25519PrivateKey,
		},
		{
			name: 'secp256k1 alice',
			arg: AliceSECP256K1PrivateKey,
		},
		// {
		// 	name: 'secp256r1 alice',
		// 	arg: AliceSECP256R1PrivateKey,
		// }, not tested due to rand function
	];
	test.each(tests)('$name', async (test) => {
		const hex = privateMessagingKeyToHex(test.arg);
		expect(privateMessagingKeyFromHex(hex)).toEqual(test.arg);
	});
});
