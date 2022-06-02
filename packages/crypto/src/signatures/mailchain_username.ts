import { PrivateKey, PublicKey } from '../';
import { ED25519PrivateKey, ED25519PublicKey } from '../ed25519';
import { ErrorUnsupportedKey } from './errors';

const mailchainUsernameMessage = function (message) {
	const prefix = Buffer.from(`\u0011Mailchain username ownership:\n${message.length}\n`, 'utf-8');
	return Buffer.concat([prefix, message]);
};

/**
 * Signs a message using the Mailchain username with the identity private key.
 * @param key
 * @param username
 */
export async function SignMailchainUsername(key: PrivateKey, username: Uint8Array): Promise<Uint8Array> {
	switch (key.constructor) {
		case ED25519PrivateKey:
			const msg = mailchainUsernameMessage(username);
			return key.Sign(msg);
		default:
			throw new ErrorUnsupportedKey();
	}
}

/**
 * Verifies a message linking a username with an identity key is valid.
 * @param key
 * @param username
 * @param signature
 * @returns
 */
export async function VerifyMailchainUsername(key: PublicKey, username, signature: Uint8Array): Promise<boolean> {
	switch (key.constructor) {
		case ED25519PublicKey:
			const msg = mailchainUsernameMessage(username);
			return key.Verify(msg, signature);
		default:
			throw new ErrorUnsupportedKey();
	}
}
