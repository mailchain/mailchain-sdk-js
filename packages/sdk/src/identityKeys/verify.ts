import { verifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';

import { decodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/internal/protocols';
import { formatAddress } from '@mailchain/internal/addressing';
import { AddressesApiFactory, MessagingKeysApiFactory } from '../api';
import { Configuration } from '../mailchain';
import { createAxiosConfiguration } from '../axios/config';
import { getPublicKeyFromApiResponse } from './lookup';

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

	const mailchainPublicKey = getPublicKeyFromApiResponse(mailchainPublicKeyResponse.data.key);

	const result = await addressApi.getAddressMessagingKey(
		formatAddress({ value: address, protocol, domain: mailchainMailDomain }, 'mail'),
	);
	const { registeredKeyProof, providedKeyProof } = result.data;
	const keyProof = providedKeyProof ?? registeredKeyProof;
	if (!result.data.messagingKey?.value || !result.data.providedKeyProof?.signature) return false;

	const userKey = getPublicKeyFromApiResponse(result.data.messagingKey);
	if (!result.data.messagingKey?.value || keyProof?.signature !== undefined) false;

	return verifyMailchainProvidedMessagingKey(
		mailchainPublicKey,
		userKey,
		decodeHexZeroX(result.data.providedKeyProof.signature),
		result.data.providedKeyProof.address!,
		protocol,
	);
}
