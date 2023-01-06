import { KeyRingDecrypter } from '@mailchain/keyring';
import { encodeHexZeroX, decodeHexZeroX } from '@mailchain/encoding';
import { TransportApiFactory, createAxiosConfiguration, getAxiosWithSigner } from '@mailchain/api';
import { signMailchainDeliveryConfirmation } from '@mailchain/signatures';
import { Configuration } from '../../mailchain';

export async function confirmDelivery(configuration: Configuration, messagingKey: KeyRingDecrypter, hash: string) {
	const transportApi = TransportApiFactory(
		createAxiosConfiguration(configuration.apiPath),
		undefined,
		getAxiosWithSigner(messagingKey),
	);
	const signature = await signMailchainDeliveryConfirmation(messagingKey, decodeHexZeroX(hash));
	await transportApi.putDeliveryRequestConfirmation(hash, {
		signature: encodeHexZeroX(signature),
	});
}
