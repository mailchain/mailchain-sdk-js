/* eslint-disable @typescript-eslint/naming-convention */
import {
	ExtendedPrivateKey,
	PublicKey,
	RandomFunction,
	secureRandom,
	PrivateKeyEncrypter,
	ED25519PrivateKey,
	encodePrivateKey,
} from '@mailchain/crypto';
import { protocol } from '../../../protobuf/protocol/protocol';
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
	const encryptedMessageKey = await encrypter.encrypt(
		encodePrivateKey(messageRootEncryptionKey.privateKey as ED25519PrivateKey),
	); //TODO: look into encoding extended keys
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
