/* eslint-disable @typescript-eslint/naming-convention */
import { PublicKey, RandomFunction, secureRandom, encodePublicKey, ED25519KeyExchange } from '@mailchain/crypto';
import { protocol } from '../../../protobuf/protocol/protocol';

export async function createECDHKeyBundle(
	recipientMessagingKey: PublicKey,
	rand: RandomFunction = secureRandom,
): Promise<{
	keyBundle: protocol.ECDHKeyBundle;
	secret: Uint8Array;
}> {
	const keyEx = new ED25519KeyExchange(rand);
	const ephemeralKey = await keyEx.EphemeralKey();
	const sharedSecret = await keyEx.SharedSecret(ephemeralKey, recipientMessagingKey);

	const payload = {
		publicMessagingKey: encodePublicKey(recipientMessagingKey),
		publicEphemeralKey: encodePublicKey(ephemeralKey.publicKey),
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
