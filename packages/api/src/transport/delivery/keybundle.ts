import { PublicKey, RandomFunction, SecureRandom } from '@mailchain/crypto';
import { ED25519KeyExchange } from '@mailchain/crypto/cipher/ecdh';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { protocol } from '@mailchain/protobuf';

export async function createECDHKeyBundle(
	recipientIdentityKey: PublicKey,
	rand: RandomFunction = SecureRandom,
): Promise<{
	keyBundle: protocol.ECDHKeyBundle;
	secret: Uint8Array;
}> {
	const keyEx = new ED25519KeyExchange(rand);
	const ephemeralKey = await keyEx.EphemeralKey();
	const sharedSecret = await keyEx.SharedSecret(ephemeralKey, recipientIdentityKey);

	const payload = {
		publicIdentityKey: EncodePublicKey(recipientIdentityKey),
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
