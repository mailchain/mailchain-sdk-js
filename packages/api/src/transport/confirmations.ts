import { KeyRingDecrypter } from '@mailchain/keyring/functions';
import { EncodeHexZeroX, DecodeHexZeroX } from '@mailchain/encoding/hex';
import { signMailchainDeliveryConfirmation } from '@mailchain/crypto/signatures/mailchain_message_confirmation';
import { Configuration, TransportApiFactory } from '../api';
import { getAxiosWithSigner } from '../auth/jwt';

export async function confirmDelivery(configuration: Configuration, messagingKey: KeyRingDecrypter, hash: string) {
	const transportApi = TransportApiFactory(configuration, undefined, getAxiosWithSigner(messagingKey));
	const signature = await signMailchainDeliveryConfirmation(messagingKey, DecodeHexZeroX(hash));
	await transportApi.putDeliveryRequestConfirmation(hash, {
		signature: EncodeHexZeroX(signature),
	});
}
