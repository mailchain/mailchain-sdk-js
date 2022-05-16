import { ExtendedPrivateKey, PublicKey, RandomFunction, SecureRandom } from '@mailchain/crypto';

import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { protocol } from '@mailchain/protobuf';
import { createEnvelope } from './envelope';

export async function createDelivery(
	recipientDestinationKey: PublicKey,
	recipientIdentityKey: PublicKey,
	messageKey: ExtendedPrivateKey,
	messageURI: string,
	rand: RandomFunction = SecureRandom,
): Promise<protocol.Delivery> {
	const payload = {
		destinationIdentity: EncodePublicKey(recipientDestinationKey),
		envelope: await createEnvelope(recipientIdentityKey, messageKey, messageURI, rand),
	} as protocol.IDelivery;

	var errMsg = protocol.Delivery.verify(payload);
	if (errMsg) throw Error(errMsg);

	return protocol.Delivery.create(payload);
}
