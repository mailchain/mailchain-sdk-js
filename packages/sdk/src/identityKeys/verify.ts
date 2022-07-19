import { VerifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';

import { DecodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/internal/protocols';
import { formatAddress } from '@mailchain/internal/addressing';
import { AddressesApiFactory, MessagingKeysApiFactory, Configuration } from '../api';
import { getPublicKeyFromApiResponse } from './lookup';

export async function verify(
	apiConfig: Configuration,
	address: string,
	protocol: ProtocolType,
	mailchainMailDomain: string,
): Promise<Boolean> {
	const addressApi = AddressesApiFactory(apiConfig);
	const verificationApi = MessagingKeysApiFactory(apiConfig);
	const mailchainPublicKeyResponse = await verificationApi.getMailchainPublicKey();
	if (!mailchainPublicKeyResponse.data.key?.value) return false;

	const mailchainPublicKey = getPublicKeyFromApiResponse(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(
		formatAddress({ value: address, protocol, domain: mailchainMailDomain }, 'mail'),
	);
	const { registeredKeyProof, providedKeyProof } = result.data;
	const keyProof = providedKeyProof ?? registeredKeyProof;
	if (!result.data.messagingKey?.value || !result.data.providedKeyProof?.signature) return false;

	const userKey = getPublicKeyFromApiResponse(result.data.messagingKey);
	if (!result.data.messagingKey?.value || keyProof?.signature !== undefined) false;

	return VerifyMailchainProvidedMessagingKey(
		mailchainPublicKey,
		userKey,
		DecodeHexZeroX(result.data.providedKeyProof.signature),
		result.data.providedKeyProof.address!,
		protocol,
	);
}
