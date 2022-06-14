/* eslint-disable @typescript-eslint/naming-convention */
import { PrivateKey, PublicKey, RandomFunction, SecureRandom } from '@mailchain/crypto';
import { ED25519KeyExchange } from '@mailchain/crypto/cipher/ecdh';
import { DecodePublicKey, EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { protocol } from '../../protobuf/protocol/protocol';

export async function createECDHKeyBundle(
	recipientMessagingKey: PublicKey,
	rand: RandomFunction = SecureRandom,
): Promise<{
	keyBundle: protocol.ECDHKeyBundle;
	secret: Uint8Array;
}> {
	const keyEx = new ED25519KeyExchange(rand);
	const ephemeralKey = await keyEx.EphemeralKey();
	const sharedSecret = await keyEx.SharedSecret(ephemeralKey, recipientMessagingKey);

	const payload = {
		publicMessagingKey: EncodePublicKey(recipientMessagingKey),
		publicEphemeralKey: EncodePublicKey(ephemeralKey.PublicKey),
	} as protocol.IECDHKeyBundle;

	var errMsg = protocol.ECDHKeyBundle.verify(payload);
	if (errMsg) {
		throw Error(errMsg);
	}

	return {
		secret: sharedSecret,
		keyBundle: protocol.ECDHKeyBundle.create(payload),
	};
}
