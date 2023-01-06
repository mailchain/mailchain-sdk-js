import { decodeHexZeroX } from '@mailchain/encoding';
import { createWalletAddress, formatAddress, ProtocolType } from '@mailchain/addressing';
import { AddressesApiFactory, MessagingKeysApiFactory, ApiKeyConvert, createAxiosConfiguration } from '@mailchain/api';
import { verifyMailchainProvidedMessagingKey } from '@mailchain/signatures';
import { Configuration } from '../../mailchain';

export async function verify(
	config: Configuration,
	address: string,
	protocol: ProtocolType,
	mailchainMailDomain: string,
): Promise<Boolean> {
	const addressApi = AddressesApiFactory(createAxiosConfiguration(config.apiPath));
	const verificationApi = MessagingKeysApiFactory(createAxiosConfiguration(config.apiPath));
	const mailchainPublicKeyResponse = await verificationApi.getMailchainPublicKey();
	if (!mailchainPublicKeyResponse.data.key?.value) return false;

	const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(
		formatAddress(createWalletAddress(address, protocol, mailchainMailDomain), 'mail'),
	);
	const { registeredKeyProof, providedKeyProof } = result.data;
	const keyProof = providedKeyProof ?? registeredKeyProof;
	if (!result.data.messagingKey?.value || !result.data.providedKeyProof?.signature) return false;

	const userKey = ApiKeyConvert.public(result.data.messagingKey);
	if (!result.data.messagingKey?.value || keyProof?.signature !== undefined) return false;

	return verifyMailchainProvidedMessagingKey(
		mailchainPublicKey,
		userKey,
		decodeHexZeroX(result.data.providedKeyProof.signature),
		result.data.providedKeyProof.address!,
		protocol,
	);
}
