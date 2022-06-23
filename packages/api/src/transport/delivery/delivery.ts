/* eslint-disable @typescript-eslint/naming-convention */

import { ExtendedPrivateKey, PublicKey, RandomFunction, secureRandom } from '@mailchain/crypto';

import { protocol } from '../../protobuf/protocol/protocol';
import { createEnvelope } from './envelope';

export async function createDelivery(
	recipientMessagingKey: PublicKey,
	messageRootEncryptionKey: ExtendedPrivateKey,
	messageURI: string,
	rand: RandomFunction = secureRandom,
): Promise<protocol.Delivery> {
	const payload = {
		envelope: await createEnvelope(recipientMessagingKey, messageRootEncryptionKey, messageURI, rand),
	} as protocol.IDelivery;

	var errMsg = protocol.Delivery.verify(payload);
	if (errMsg) throw Error(errMsg);

	return protocol.Delivery.create(payload);
}
