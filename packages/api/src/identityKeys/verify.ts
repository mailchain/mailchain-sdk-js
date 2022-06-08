import { VerifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';
import { ErrorUnsupportedKey } from '@mailchain/crypto/signatures/errors';
import { ED25519PublicKey } from '@mailchain/crypto/ed25519';
import { DecodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/internal/protocols';
import { formatMailLike } from '@mailchain/internal/addressing';
import { AddressesApiFactory, PublicKeyCurveEnum, MessagingKeysApiFactory, Configuration, PublicKey } from '../api';

// ToDo: move somewhere to generic
const getKeyByResponse = (key: PublicKey) => {
	switch (key.curve) {
		case PublicKeyCurveEnum.Ed25519: {
			return new ED25519PublicKey(DecodeHexZeroX(key.value));
		}

		default:
			throw new ErrorUnsupportedKey();
	}
};

export async function verify(apiConfig: Configuration, address: string, protocol: ProtocolType): Promise<Boolean> {
	const addressApi = AddressesApiFactory(apiConfig);
	const verificationApi = MessagingKeysApiFactory(apiConfig);
	const mailchainPublicKeyResponse = await verificationApi.getMailchainPublicKey();
	if (!mailchainPublicKeyResponse.data.key?.value) return false;

	const mailchainPublicKey = getKeyByResponse(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(formatMailLike(address, protocol));
	if (!result.data.messagingKey?.value || !result.data.providedKeyProof?.signature) return false;

	const userKey = getKeyByResponse(result.data.messagingKey);

	return VerifyMailchainProvidedMessagingKey(
		mailchainPublicKey,
		userKey,
		DecodeHexZeroX(result.data.providedKeyProof.signature),
		address,
		protocol,
	);
}
