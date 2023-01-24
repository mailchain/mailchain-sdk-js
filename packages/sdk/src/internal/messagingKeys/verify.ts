import { decodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/addressing';
import {
	MessagingKeysApiFactory,
	ApiKeyConvert,
	createAxiosConfiguration,
	RegisteredKeyProof,
	ProvidedKeyProof,
	GetAddressMessagingKeyResponseBody,
	getAddressFromApiResponse,
	MessagingKeysApiInterface,
} from '@mailchain/api';
import { PublicKey } from '@mailchain/crypto';
import { createProofMessage, ProofParams } from '@mailchain/signatures/keyreg';
import {
	verifyMailchainProvidedMessagingKey,
	AddressVerificationFailed,
	PublicKeyNotFoundFailed,
	verify,
} from '@mailchain/signatures';
import { Configuration } from '../../mailchain';

export interface VerifyAddressMessagingKeyResult {
	messagingKey: PublicKey;
	identityKey?: PublicKey;
	method: 'provided' | 'registered';
	result: boolean;
}

export class Verifier {
	constructor(private readonly messagingKeysApi: MessagingKeysApiInterface) {}

	static create(configuration: Configuration) {
		return new Verifier(MessagingKeysApiFactory(createAxiosConfiguration(configuration.apiPath)));
	}

	async verifyRegisteredKeyProof(
		registeredKeyProof: RegisteredKeyProof,
		messagingKey: PublicKey,
	): Promise<{
		identityKey?: PublicKey;
		result: boolean;
	}> {
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

		return {
			identityKey,
			result: isVerified,
		};
	}

	async verifyProvidedKeyProof(providedKeyProof: ProvidedKeyProof, messagingKey: PublicKey) {
		const mailchainPublicKeyResponse = await this.messagingKeysApi.getMailchainPublicKey();

		if (!mailchainPublicKeyResponse.data.key?.value) throw new PublicKeyNotFoundFailed();
		const mailchainPublicKey = ApiKeyConvert.public(mailchainPublicKeyResponse.data.key);

		if (!providedKeyProof?.signature) throw new AddressVerificationFailed();

		return await verifyMailchainProvidedMessagingKey(
			mailchainPublicKey,
			messagingKey,
			decodeHexZeroX(providedKeyProof?.signature),
			providedKeyProof.address!,
			providedKeyProof.protocol as ProtocolType,
		);
	}

	async verifyAddressMessagingKey(
		response: GetAddressMessagingKeyResponseBody,
	): Promise<VerifyAddressMessagingKeyResult> {
		const { registeredKeyProof, providedKeyProof, messagingKey: apiMessagingKey } = response;
		const messagingKey = ApiKeyConvert.public(apiMessagingKey);

		if (providedKeyProof) {
			return {
				identityKey: undefined,
				method: 'provided',
				messagingKey,
				result: await this.verifyProvidedKeyProof(providedKeyProof, messagingKey),
			};
		} else if (registeredKeyProof) {
			return {
				method: 'registered',
				messagingKey,
				...(await this.verifyRegisteredKeyProof(registeredKeyProof, messagingKey)),
			};
		}
		throw new Error(`no proof provided`);
	}
}