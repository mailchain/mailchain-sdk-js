import {
	AliceED25519PublicKey,
	BobED25519PublicKey,
	BobED25519PrivateKey,
	AliceED25519PrivateKey,
} from '@mailchain/crypto/ed25519/test.const';
import {
	BobSECP256K1PublicKey,
	AliceSECP256K1PublicKey,
	BobSECP256K1PrivateKey,
	AliceSECP256K1PrivateKey,
} from '@mailchain/crypto/secp256k1/test.const';
import {
	BobSR25519PublicKey,
	AliceSR25519PublicKey,
	BobSR25519PrivateKey,
	AliceSR25519PrivateKey,
} from '@mailchain/crypto/sr25519/test.const';
import { SECP256K1KeyExchange, ED25519KeyExchange, SR25519KeyExchange } from '../ecdh';
import { PublicKeyDecrypter, PublicKeyEncrypter } from '.';

describe('encrypt-then-decrypt', () => {
	const tests = [
		{
			name: 'secp25519-to-bob',
			keyEx: new SECP256K1KeyExchange(),
			recipientPublicKey: BobSECP256K1PublicKey,
			recipientPrivateKey: BobSECP256K1PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
		{
			name: 'secp25519-to-alice',
			keyEx: new SECP256K1KeyExchange(),
			recipientPublicKey: AliceSECP256K1PublicKey,
			recipientPrivateKey: AliceSECP256K1PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
		{
			name: 'ed25519-to-bob',
			keyEx: new ED25519KeyExchange(),
			recipientPublicKey: BobED25519PublicKey,
			recipientPrivateKey: BobED25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
		{
			name: 'ed25519-to-alice',
			keyEx: new ED25519KeyExchange(),
			recipientPublicKey: AliceED25519PublicKey,
			recipientPrivateKey: AliceED25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
		{
			name: 'sr25519-to-bob',
			keyEx: new SR25519KeyExchange(),
			recipientPublicKey: BobSR25519PublicKey,
			recipientPrivateKey: BobSR25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
		{
			name: 'sr25519-to-alice',
			keyEx: new SR25519KeyExchange(),
			recipientPublicKey: AliceSR25519PublicKey,
			recipientPrivateKey: AliceSR25519PrivateKey,
			message: new Uint8Array(Buffer.from('message', 'ascii')),
		},
	];
	test.each(tests)('%p', async (test) => {
		const encrypter = new PublicKeyEncrypter(test.keyEx, test.recipientPublicKey);
		const encrypted = await encrypter.encrypt(test.message);

		const decrypter = new PublicKeyDecrypter(test.keyEx, test.recipientPrivateKey);
		const decrypted = await decrypter.decrypt(encrypted);

		expect(decrypted).toEqual(test.message);
	});
});
