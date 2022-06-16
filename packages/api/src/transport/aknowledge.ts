import { KeyRingDecrypter } from '@mailchain/keyring/address';
import { Configuration, TransportApiFactory } from '../api';
import { getAxiosWithSigner } from '../auth/jwt';
import { EncodeHexZeroX, DecodeHexZeroX } from '@mailchain/encoding/hex';
import { signMailchainDeliveryConfirmation } from '@mailchain/crypto/signatures/mailchain_message_confirmation';

export const acknowledgeReceiving = async (
	configuration: Configuration,
	messagingKey: KeyRingDecrypter,
	hash: string,
) => {
	const transportApi = TransportApiFactory(configuration, undefined, getAxiosWithSigner(messagingKey));
	const signature = await signMailchainDeliveryConfirmation(messagingKey, DecodeHexZeroX(hash));
	return transportApi
		.putDeliveryRequestConfirmation(hash, {
			signature: EncodeHexZeroX(signature),
		})
		.catch(({ error }) => {
			console.log(error);
			return error;
		});
};
