import { VerifiableCredential, createVerifiablePresentationJwt } from 'did-jwt-vc';
import { SignerWithPublicKey, publicKeyToBytes } from '@mailchain/crypto';
import { Proof } from 'did-jwt-vc/lib/types';
import { encodeHex } from '@mailchain/encoding';
import {
	AddressNotRegisteredError,
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

export type CreateVerifiableMailchainAddressOwnerError =
	| CreateMailchainMessagingKeyIssuerError
	| AddressNotRegisteredError
	| ResolveAddressError;

export type CreateVerifiableMailchainAddressOwnerParams = {
	/**
	 * Uniquely identify request.
	 */
	id?: string;
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
	requester: DecentralizedIdentifier<string>,
	actions: string[],
	resources: string[],
): VerifiableCredential {
	return createVerifiableCredential({
		type: 'MailchainMessagingKeyCredential',
		credentialSubjects: [createOwnerOfMessagingKeySubject(resolvedAddress.mailchainAddress)],
		issuanceDate: new Date(),
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

	static create(configuration: Configuration) {
		return new MailchainAddressOwnershipIssuer(
			MessagingKeys.create(configuration),
			new MailchainMessagingKeyIssuer(),
		);
	}

	async createVerifiableMailchainAddressOwnership(
		params: CreateVerifiableMailchainAddressOwnerParams,
	): Promise<MailchainResult<VerifiablePresentationJWT, CreateVerifiableMailchainAddressOwnerError>> {
		const { address, signer, requester, options, actions, resources, id } = params;
		const { data: resolvedAddress, error: resolveAddressError } = await this.messagingKeys.resolve(address);
		if (resolveAddressError) {
			return {
				error: resolveAddressError,
			};
		}

		if (resolvedAddress.type !== 'registered') {
			return {
				error: new AddressNotRegisteredError(),
			};
		}

		const { expiresIn, expiresAt, nonce } = options;

		const presentationPayload = createPresentationPayload({
			id,
			verifiableCredential: createCredentialPayloadMailchainAddressOwner(
				resolvedAddress,
				mailchainAddressDecentralizedIdentifier(requester),
				actions,
				resources,
			),
			holder: mailchainAddressDecentralizedIdentifier(resolvedAddress.mailchainAddress),
			verifier: mailchainAddressDecentralizedIdentifier(requester),
			expiresAt,
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
			expiresIn,
		});

		return { data: verifiablePresentation };
	}
}
