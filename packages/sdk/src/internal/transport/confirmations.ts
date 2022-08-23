import { KeyRingDecrypter } from '@mailchain/keyring';
import { encodeHexZeroX, decodeHexZeroX } from '@mailchain/encoding';
import { signMailchainDeliveryConfirmation } from '../signatures/mailchain_message_confirmation';
import { TransportApiFactory } from '../api';
import { getAxiosWithSigner } from '../auth/jwt';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';

export async function confirmDelivery(configuration: Configuration, messagingKey: KeyRingDecrypter, hash: string) {
	const transportApi = TransportApiFactory(
		createAxiosConfiguration(configuration),
		undefined,
		getAxiosWithSigner(messagingKey),
	);
	const signature = await signMailchainDeliveryConfirmation(messagingKey, decodeHexZeroX(hash));
	await transportApi.putDeliveryRequestConfirmation(hash, {
		signature: encodeHexZeroX(signature),
	});
}