import { encodeHex } from '@mailchain/encoding';
import { KeyRingDecrypter } from '@mailchain/keyring';

export const mailchainDeliveryConfirmationMessage = (deliveryRequestID: Uint8Array): Uint8Array => {
	return Buffer.from(`\x11Mailchain delivery confirmation:\n${encodeHex(deliveryRequestID)}`, 'utf-8');
};

export const signMailchainDeliveryConfirmation = (pk: KeyRingDecrypter, deliveryRequestID: Uint8Array) => {
	const msg: Uint8Array = mailchainDeliveryConfirmationMessage(deliveryRequestID);

	return pk.sign(msg);
};
