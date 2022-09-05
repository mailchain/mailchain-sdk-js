import { decodeHexZeroX } from '@mailchain/encoding';
import { createMailchainAddress, formatAddress, ProtocolType } from '@mailchain/addressing';
import { verifyMailchainProvidedMessagingKey } from '../signatures/mailchain_msgkey';
import { ApiKeyConvert } from '../apiHelpers';
import { AddressesApiFactory, MessagingKeysApiFactory } from '../api';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';

export async function verify(
	config: Configuration,
	address: string,
	protocol: ProtocolType,
	mailchainMailDomain: string,
): Promise<Boolean> {
	const addressApi = AddressesApiFactory(createAxiosConfiguration(config));
	const verificationApi = MessagingKeysApiFactory(createAxiosConfiguration(config));
	const mailchainPublicKeyResponse = await verificationApi.getMailchainPublicKey();
	if (!mailchainPublicKeyResponse.data.key?.value) return false;

	const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(
		formatAddress(createMailchainAddress(address, protocol, mailchainMailDomain), 'mail'),
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
