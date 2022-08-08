import { verifyMailchainProvidedMessagingKey } from '@mailchain/crypto/signatures/mailchain_msgkey';
import { AddressVerificationFailed, PublicKeyNotFoundFailed } from '@mailchain/crypto/signatures/errors';
import { createProofMessage } from '@mailchain/keyreg/proofs/message';
import { ProofParams } from '@mailchain/keyreg/proofs/params';
import { decodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/internal/protocols';
import { verify } from '@mailchain/crypto/signatures/verify';
import { MailchainAddress } from '@mailchain/internal/addressing';
import { decode } from '@mailchain/encoding/encoding';
import { ApiKeyConvert } from '../apiHelpers';
import {
	MessagingKeysApi,
	ProvidedKeyProof,
	RegisteredKeyProof,
	AddressesApiFactory,
	MessagingKeysApiFactory,
	PublicKey,
	Address,
	AddressesApi,
} from '../api';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';

export const getAddressFromApiResponse = (address: Address) => {
	return decode(address.encoding!, address.value);
};

export type LookupResult = { address: MailchainAddress; messageKey: PublicKey };
export class Lookup {
	constructor(private readonly addressApi: AddressesApi, private readonly messagingKeysApi: MessagingKeysApi) {}

	private checkRegisteredKeyProof = async (registeredKeyProof: RegisteredKeyProof, messagingKey: PublicKey) => {
		const params = {
			AddressEncoding: registeredKeyProof?.address.encoding,
			PublicKeyEncoding: registeredKeyProof?.messagingKeyEncoding,
			Locale: registeredKeyProof?.locale,
			Variant: registeredKeyProof?.variant,
		} as ProofParams;

		const message = createProofMessage(
			params,
			getAddressFromApiResponse(registeredKeyProof.address),
			ApiKeyConvert.public(messagingKey),
			registeredKeyProof.nonce!,
		);
		// verify the proof with the correct signer
		const isVerified = verify(
			registeredKeyProof?.signingMethod!,
			ApiKeyConvert.public(registeredKeyProof?.identityKey!),
			Buffer.from(message),
			decodeHexZeroX(registeredKeyProof?.signature!),
		);
		if (!isVerified) throw new AddressVerificationFailed();
	};

	private checkProvidedKeyProof = async (providedKeyProof: ProvidedKeyProof, messagingKey: PublicKey) => {
		const mailchainPublicKeyResponse = await this.messagingKeysApi.getMailchainPublicKey();

		if (!mailchainPublicKeyResponse.data.key?.value) throw new PublicKeyNotFoundFailed();
		const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

		if (!providedKeyProof?.signature) throw new AddressVerificationFailed();
		const isKeyValid = await verifyMailchainProvidedMessagingKey(
			mailchainPublicKey,
			ApiKeyConvert.public(messagingKey),
			decodeHexZeroX(providedKeyProof?.signature),
			providedKeyProof.address!,
			providedKeyProof.protocol as ProtocolType,
		);

		if (!isKeyValid) throw new AddressVerificationFailed();
	};

	messageKey = async (address: string): Promise<LookupResult> => {
		const result = await this.addressApi.getAddressMessagingKey(address);
		const { registeredKeyProof, providedKeyProof, messagingKey } = result.data;

		if (providedKeyProof) {
			this.checkProvidedKeyProof(providedKeyProof, messagingKey);
		} else if (registeredKeyProof) {
			this.checkRegisteredKeyProof(registeredKeyProof, messagingKey);
		} else {
			throw new AddressVerificationFailed();
		}

		return {
			address: {
				value: result.data.localPart!,
				protocol: result.data.protocol as ProtocolType,
				domain: result.data.rootDomain!,
			},
			messageKey: result.data.messagingKey,
		};
	};

	static create(configuration: Configuration) {
		return new Lookup(
			AddressesApiFactory(createAxiosConfiguration(configuration)) as AddressesApi,
			MessagingKeysApiFactory(createAxiosConfiguration(configuration)) as MessagingKeysApi,
		);
	}
}
