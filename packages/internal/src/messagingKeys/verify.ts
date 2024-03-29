import { decodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/addressing';
import {
	MessagingKeysApiFactory,
	ApiKeyConvert,
	createAxiosConfiguration,
	RegisteredKeyProof,
	ProvidedKeyProof,
	getAddressFromApiResponse,
	MessagingKeysApiInterface,
} from '@mailchain/api';
import { PublicKey } from '@mailchain/crypto';
import { createProofMessage, ProofParams } from '@mailchain/signatures/keyreg';
import {
	verifyMailchainProvidedMessagingKey,
	MessagingKeyVerificationError,
	PublicKeyNotFoundError,
	verify,
} from '@mailchain/signatures';
import { Configuration } from '../configuration';

export interface VerifyAddressMessagingKeyResult {
	messagingKey: PublicKey;
	identityKey?: PublicKey;
	method: 'provided' | 'registered';
	result: boolean;
}

export class MessagingKeyVerifier {
	constructor(private readonly messagingKeysApi: MessagingKeysApiInterface) {}

	static create(configuration: Configuration) {
		return new MessagingKeyVerifier(MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)));
	}

	async verifyRegisteredKeyProof(
		registeredKeyProof: RegisteredKeyProof,
		messagingKey: PublicKey,
	): Promise<{
		identityKey?: PublicKey;
		result: boolean;
	}> {
		if (!registeredKeyProof) throw new MessagingKeyVerificationError();
		if (registeredKeyProof.signature == null) throw new MessagingKeyVerificationError();

		const params = {
			AddressEncoding: registeredKeyProof.address.encoding,
			PublicKeyEncoding: registeredKeyProof.messagingKeyEncoding,
			Locale: registeredKeyProof.locale,
			Variant: registeredKeyProof.variant,
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
			message,
			decodeHexZeroX(registeredKeyProof.signature),
		);

		return {
			identityKey,
			result: isVerified,
		};
	}

	async verifyProvidedKeyProof(providedKeyProof: ProvidedKeyProof, messagingKey: PublicKey) {
		const mailchainPublicKeyResponse = await this.messagingKeysApi.getMailchainPublicKey();

		if (!mailchainPublicKeyResponse.data.key?.value) throw new PublicKeyNotFoundError();
		const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

		if (!providedKeyProof.signature) throw new MessagingKeyVerificationError();

		return await verifyMailchainProvidedMessagingKey(
			mailchainPublicKey,
			messagingKey,
			decodeHexZeroX(providedKeyProof?.signature),
			providedKeyProof.address!,
			providedKeyProof.protocol as ProtocolType,
		);
	}
}
