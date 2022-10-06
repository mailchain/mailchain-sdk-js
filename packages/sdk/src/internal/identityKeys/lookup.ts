import { decodeHexZeroX, decode } from '@mailchain/encoding';
import { ALL_PROTOCOLS, ProtocolType } from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';
import { verifyMailchainProvidedMessagingKey } from '../signatures/mailchain_msgkey';
import { AddressVerificationFailed, PublicKeyNotFoundFailed } from '../signatures/errors';
import { createProofMessage, ProofParams } from '../keyreg';
import { verify } from '../signatures/verify';
import { ApiKeyConvert } from '../apiHelpers';
import {
	MessagingKeysApi,
	ProvidedKeyProof,
	RegisteredKeyProof,
	AddressesApiFactory,
	MessagingKeysApiFactory,
	Address,
	AddressesApi,
} from '../api';
import { Configuration } from '../../mailchain';
import { createAxiosConfiguration } from '../axios/config';

export const getAddressFromApiResponse = (address: Address) => {
	return decode(address.encoding!, address.value);
};

export type LookupResult = {
	messagingKey: PublicKey;
	identityKey?: PublicKey;
	protocol: ProtocolType;
	network?: string;
};
export class Lookup {
	constructor(private readonly addressApi: AddressesApi, private readonly messagingKeysApi: MessagingKeysApi) {}

	private async checkRegisteredKeyProof(registeredKeyProof: RegisteredKeyProof, messagingKey: PublicKey) {
		if (registeredKeyProof.signature == null) throw new AddressVerificationFailed();

		const params = {
			AddressEncoding: registeredKeyProof?.address.encoding,
			PublicKeyEncoding: registeredKeyProof?.messagingKeyEncoding,
			Locale: registeredKeyProof?.locale,
			Variant: registeredKeyProof?.variant,
		} as ProofParams;

		const message = createProofMessage(
			params,
			getAddressFromApiResponse(registeredKeyProof.address),
			messagingKey,
			registeredKeyProof.nonce,
		);
		// verify the proof with the correct signer
		const identityKey = ApiKeyConvert.public(registeredKeyProof.identityKey);
		const isVerified = await verify(
			registeredKeyProof.signingMethod,
			identityKey,
			Buffer.from(message),
			decodeHexZeroX(registeredKeyProof.signature),
		);
		if (!isVerified) throw new AddressVerificationFailed();
		return identityKey;
	}

	private async checkProvidedKeyProof(providedKeyProof: ProvidedKeyProof, messagingKey: PublicKey) {
		const mailchainPublicKeyResponse = await this.messagingKeysApi.getMailchainPublicKey();

		if (!mailchainPublicKeyResponse.data.key?.value) throw new PublicKeyNotFoundFailed();
		const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

		if (!providedKeyProof?.signature) throw new AddressVerificationFailed();
		const isKeyValid = await verifyMailchainProvidedMessagingKey(
			mailchainPublicKey,
			messagingKey,
			decodeHexZeroX(providedKeyProof?.signature),
			providedKeyProof.address!,
			providedKeyProof.protocol as ProtocolType,
		);

		if (!isKeyValid) throw new AddressVerificationFailed();
	}

	async messageKey(address: string): Promise<LookupResult> {
		const { data } = await this.addressApi.getAddressMessagingKey(address);
		const { registeredKeyProof, providedKeyProof, messagingKey: apiMessagingKey } = data;

		const messagingKey = ApiKeyConvert.public(apiMessagingKey);
		let identityKey: PublicKey | undefined = undefined;
		if (providedKeyProof) {
			await this.checkProvidedKeyProof(providedKeyProof, messagingKey);
		} else if (registeredKeyProof) {
			identityKey = await this.checkRegisteredKeyProof(registeredKeyProof, messagingKey);
		} else {
			throw new AddressVerificationFailed();
		}

		const protocol = data.protocol as ProtocolType;
		if (!ALL_PROTOCOLS.includes(protocol)) {
			throw new Error(`invalid address protocol of [${data.protocol}]`);
		}

		return { messagingKey, identityKey, protocol };
	}

	static create(configuration: Configuration) {
		return new Lookup(
			AddressesApiFactory(createAxiosConfiguration(configuration)) as AddressesApi,
			MessagingKeysApiFactory(createAxiosConfiguration(configuration)) as MessagingKeysApi,
		);
	}
}
