import {
	AliceED25519PublicKey,
	BobED25519PublicKey,
	BobED25519PrivateKey,
	AliceED25519PrivateKey,
} from '../../ed25519/test.const';
import { ED25519KeyExchange } from '../ecdh/ed25519';
import { PublicKeyDecrypter, PublicKeyEncrypter } from '.';

describe('encrypt-then-decrypt', () => {
	const tests = [
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
	];
	test.each(tests)('%p', async (test) => {
		const encrypter = new PublicKeyEncrypter(test.keyEx, test.recipientPublicKey);
		const encrypted = await encrypter.encrypt(test.message);

		const decrypter = new PublicKeyDecrypter(test.keyEx, test.recipientPrivateKey);
		const decrypted = await decrypter.decrypt(encrypted);

		expect(decrypted).toEqual(test.message);
	});
});
