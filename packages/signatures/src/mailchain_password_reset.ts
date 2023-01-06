import { PublicKey, Signer } from '@mailchain/crypto';
import { signRawEd25519, verifyRawEd25519 } from './raw_ed25519';

export const mailchainPasswordResetMessage = function (username: Uint8Array, expires: Date) {
	return Buffer.from(
		`\x11Mailchain:\naction: reset-password\nexpires: ${Math.floor(
			expires.getTime() / 1000,
		)}\nusername: ${username}`,
		'utf-8',
	);
};

/**
 * Signs a message using the Mailchain username, reset attestation message, and expiration with the identity private key.
 */
export async function signMailchainPasswordReset(
	signer: Signer,
	username: Uint8Array,
	expires: Date,
): Promise<Uint8Array> {
	return signRawEd25519(signer, mailchainPasswordResetMessage(username, expires));
}

/**
 * Verifies message linking a username, reset attestation message, and expiration with an identity key is valid.
 */
export async function verifyMailchainPasswordReset(
	key: PublicKey,
	signature: Uint8Array,
	username: Uint8Array,
	expires: Date,
): Promise<boolean> {
	return verifyRawEd25519(key, mailchainPasswordResetMessage(username, expires), signature);
}
