import { Configuration, PublicKey } from '../api';
import { AddressesApiFactory, PublicKeyCurveEnum, MessagingKeysApiFactory } from '../api';
import { VerifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';
import { ErrorUnsupportedKey } from '@mailchain/crypto/signatures/errors';
import { ED25519PublicKey } from '@mailchain/crypto/ed25519';
import { DecodeHex } from '@mailchain/encoding';

// ToDo: move somewhere to generic
const getKeyByResponse = (key: PublicKey) => {
	switch (key.curve) {
		case PublicKeyCurveEnum.Ed25519: {
			return new ED25519PublicKey(DecodeHex(key.value));
		}

		default:
			throw new ErrorUnsupportedKey();
	}
};

export async function verify(
	apiConfig: Configuration,
	address: string,
	protocol: string = 'etherium',
): Promise<Boolean> {
	const addressApi = AddressesApiFactory(apiConfig);
	const verificationApi = MessagingKeysApiFactory(apiConfig);
	const mailchainPublicKeyResponse = await verificationApi.getMailchainPublicKey();
	if (!mailchainPublicKeyResponse.data.key?.value) return false;

	let mailchainPublicKey = getKeyByResponse(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(address);
	if (!result.data.messagingKey?.value || !result.data.providedKeyProof?.signature) return false;

	let userKey = getKeyByResponse(result.data.messagingKey);

	return VerifyMailchainProvidedMessagingKey(
		mailchainPublicKey,
		userKey,
		new Uint8Array(result.data.providedKeyProof?.signature),
		address,
		protocol,
	);
}
