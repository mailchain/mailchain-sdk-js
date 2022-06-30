import { EncodeHex } from '@mailchain/encoding';
import { KeyRingDecrypter } from '../../../keyring/src/functions';

export const mailchainDeliveryConfirmationMessage = (deliveryRequestID: Uint8Array): Uint8Array => {
	return Buffer.from(`\x11Mailchain delivery confirmation:\n${EncodeHex(deliveryRequestID)}`, 'utf-8');
};

export const signMailchainDeliveryConfirmation = (pk: KeyRingDecrypter, deliveryRequestID: Uint8Array) => {
	const msg: Uint8Array = mailchainDeliveryConfirmationMessage(deliveryRequestID);

	return pk.sign(msg);
};
