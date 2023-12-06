import { VerifiableCredential, createVerifiablePresentationJwt } from 'did-jwt-vc';
import { SignerWithPublicKey, publicKeyToBytes } from '@mailchain/crypto';
import { Proof } from 'did-jwt-vc/lib/types';
import { encodeHex } from '@mailchain/encoding';
import { defaultConfiguration } from '../../configuration';
import {
	AddressNotRegisteredError,
	GroupAddressNotSupportedError,
	MessagingKeys,
	RegisteredResolvedAddress,
	ResolveAddressError,
} from '../../messagingKeys';
import { Configuration, MailchainResult } from '../..';
import {
	DecentralizedIdentifier,
	mailchainAddressDecentralizedIdentifier,
	mailchainBlockchainAddressDecentralizedIdentifier,
} from '../did';
import { createPresentationPayload } from '../presentation';
import { CreateMailchainMessagingKeyIssuerError, MailchainMessagingKeyIssuer } from '../issuer';
import { VerifiablePresentationJWT } from '../jwt';
import { createVerifiableCredential } from '../payload';
import { createOwnerOfMessagingKeySubject } from '../subject';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VerifiablePresentationRequest } from '../request';

export type CreateVerifiableMailchainAddressOwnerError =
	| CreateMailchainMessagingKeyIssuerError
	| AddressNotRegisteredError
	| ResolveAddressError
	| GroupAddressNotSupportedError;

export type CreateVerifiableMailchainAddressOwnerParams = {
	/**
	 * Recipient Mailchain address.
	 */
	address: string;
	signer: SignerWithPublicKey;
	/**
	 * Who is requesting the verifiable credential.
	 */
	requester: string;
	/**
	 * The actions that the holder is allowed to perform.
	 * @example ['Authenticate', 'Join meeting']
	 */
	actions: string[];

	resources: string[];
	options: {
		/**
		 * @see {@link VerifiablePresentationRequest.requestId}
		 */
		requestId: string;
		/**
		 * The number of seconds from the current time that the credential will expire.
		 */
		expiresIn?: number;
		/**
		 * The date and time that the credential will expire.
		 */
		expiresAt?: Date;
		nonce?: string;
	};
};

function createIssuerProof(resolvedAddress: RegisteredResolvedAddress): Proof {
	switch (resolvedAddress.proof.source) {
		case 'MailchainRegistry':
			const { signature, address, messagingKey, identityKey, ...remainingProof } = resolvedAddress.proof;
			return {
				signatureHex: encodeHex(signature),
				addressHex: encodeHex(address),
				messagingKeyHex: encodeHex(publicKeyToBytes(messagingKey)),
				identityKeyHex: encodeHex(publicKeyToBytes(identityKey)),
				...remainingProof,
				type: 'Mailchain-Ed25519Signature2020',
			};
		case 'ContractCall':
			return {
				...resolvedAddress.proof,
				type: 'Mailchain-Ed25519Signature2020',
			};
		default:
			throw new Error(`unknown proof source ${(resolvedAddress.proof as Proof).source}`);
	}
}

function createCredentialPayloadMailchainAddressOwner(
	resolvedAddress: RegisteredResolvedAddress,
	requester: DecentralizedIdentifier,
	issuanceDate: Date,
	actions: string[],
	resources: string[],
): VerifiableCredential {
	return createVerifiableCredential({
		type: 'MailchainMessagingKeyCredential',
		credentialSubjects: [createOwnerOfMessagingKeySubject(resolvedAddress.mailchainAddress)],
		issuanceDate,
		issuerId: mailchainBlockchainAddressDecentralizedIdentifier(
			resolvedAddress.protocol,
			resolvedAddress.protocolAddress,
		),
		proof: createIssuerProof(resolvedAddress),
		termsOfUse: [
			{
				type: 'HolderPolicy',
				assigner: mailchainAddressDecentralizedIdentifier(resolvedAddress.mailchainAddress),
				effect: 'Allow',
				assignee: requester,
				actions,
				resources,
			},
		],
	});
}

export class MailchainAddressOwnershipIssuer {
	constructor(
		private readonly messagingKeys: MessagingKeys,
		private readonly mailchainMessagingKeyIssuer: MailchainMessagingKeyIssuer,
	) {}

	static create(configuration: Configuration = defaultConfiguration) {
		return new MailchainAddressOwnershipIssuer(
			MessagingKeys.create(configuration),
			new MailchainMessagingKeyIssuer(),
		);
	}

	async createVerifiableMailchainAddressOwnership(
		params: CreateVerifiableMailchainAddressOwnerParams,
	): Promise<MailchainResult<VerifiablePresentationJWT, CreateVerifiableMailchainAddressOwnerError>> {
		const { address, signer, requester, options, actions, resources } = params;
		const { data: resolvedAddress, error: resolveAddressError } = await this.messagingKeys.resolveIndividual(
			address,
		);
		if (resolveAddressError) return { error: resolveAddressError };

		if (resolvedAddress.type !== 'registered') return { error: new AddressNotRegisteredError() };

		const { requestId, expiresIn, expiresAt, nonce } = options;
		const issuanceDate = new Date();

		const presentationPayload = createPresentationPayload({
			requestId,
			issuanceDate,
			verifiableCredential: createCredentialPayloadMailchainAddressOwner(
				resolvedAddress,
				mailchainAddressDecentralizedIdentifier(requester),
				issuanceDate,
				actions,
				resources,
			),
			holder: mailchainAddressDecentralizedIdentifier(resolvedAddress.mailchainAddress),
			verifier: mailchainAddressDecentralizedIdentifier(requester),
			expirationDate: resolveExpirationDate(issuanceDate, expiresAt, expiresIn),
		});

		const { data: issuer, error: createMailchainMessagingKeyIssuerError } =
			await this.mailchainMessagingKeyIssuer.createIssuerFromResolvedAddress({
				resolvedAddress,
				signer,
			});

		if (createMailchainMessagingKeyIssuerError) {
			return {
				error: createMailchainMessagingKeyIssuerError,
			};
		}

		const verifiablePresentation = await createVerifiablePresentationJwt(presentationPayload, issuer, {
			// challenge and domain are used to prevent replay attacks
			challenge: nonce,
			domain: mailchainAddressDecentralizedIdentifier(requester),
			canonicalize: true,
		});

		return { data: verifiablePresentation };
	}
}

/**
 * Resolve the credential expiration date with the resolution being to date with the earliest expiration date.
 */
export function resolveExpirationDate(
	issuanceDate: Date,
	expiresAt: Date | undefined,
	expiresIn: number | undefined,
): Date | undefined {
	if (expiresAt == null && expiresIn == null) return undefined;
	if (expiresIn == null) return expiresAt;

	const expiresInTimestamp = issuanceDate.getTime() + expiresIn * 1000;
	if (expiresAt == null) return new Date(expiresInTimestamp);

	return new Date(Math.min(expiresInTimestamp, expiresAt.getTime()));
}
