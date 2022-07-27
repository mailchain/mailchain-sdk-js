/* eslint-disable @typescript-eslint/naming-convention */
import { ExtendedPrivateKey, PublicKey, RandomFunction, secureRandom } from '@mailchain/crypto';
import { PrivateKeyEncrypter } from '@mailchain/crypto/cipher/nacl/private-key-encrypter';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodePrivateKey } from '@mailchain/crypto/multikey/encoding';
import { protocol } from '../../protobuf/protocol/protocol';
import { createECDHKeyBundle } from './keybundle';

/**
 *
 * @param recipientIdentityKey this is a Mailchain identity key.
 * @param messageKey root key used to encrypt message and payload
 */
export async function createEnvelope(
	recipientMessagingKey: PublicKey,
	messageRootEncryptionKey: ExtendedPrivateKey,
	messageURI: string,
	rand: RandomFunction = secureRandom,
): Promise<protocol.Envelope> {
	const keyBundle = await createECDHKeyBundle(recipientMessagingKey, rand);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(keyBundle.secret), rand);
	const encryptedMessageKey = await encrypter.encrypt(EncodePrivateKey(messageRootEncryptionKey.privateKey)); //TODO: look into encoding extended keys
	const encryptedMessageURI = await encrypter.encrypt(Buffer.from(messageURI, 'utf8'));

	const payload = {
		encryptedMessageKey,
		encryptedMessageUri: encryptedMessageURI,
		ecdhKeyBundle: keyBundle.keyBundle,
	} as protocol.IEnvelope;

	var errMsg = protocol.Envelope.verify(payload);
	if (errMsg) throw Error(errMsg);

	return protocol.Envelope.create(payload);
}