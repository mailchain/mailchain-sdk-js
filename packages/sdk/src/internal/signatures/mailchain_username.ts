import { PublicKey, Signer } from '@mailchain/crypto';
import { signRawEd25519, verifyRawEd25519 } from './raw_ed25119';

const mailchainUsernameMessage = function (message) {
	const prefix = Buffer.from(`\x11Mailchain username ownership:\n${message.length}\n`, 'utf-8');
	return Buffer.concat([prefix, message]);
};

/**
 * Signs a message using the Mailchain username with the identity private key.
 * @param key
 * @param username
 */
export async function signMailchainUsername(signer: Signer, username: Uint8Array): Promise<Uint8Array> {
	return signRawEd25519(signer, mailchainUsernameMessage(username));
}

/**
 * Verifies a message linking a username with an identity key is valid.
 * @param key
 * @param username
 * @param signature
 * @returns
 */
export async function verifyMailchainUsername(
	key: PublicKey,
	signature: Uint8Array,
	username: Uint8Array,
): Promise<boolean> {
	return verifyRawEd25519(key, mailchainUsernameMessage(username), signature);
}
