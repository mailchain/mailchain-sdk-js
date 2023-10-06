import { SignerWithPublicKey } from '@mailchain/crypto';
import { ValidateAddressError, checkAddressForErrors } from '@mailchain/addressing';
import { defaultConfiguration } from '../../configuration';
import { ValidationError } from '../../errors/validation';
import { VerifiablePresentationRequest } from '../request';
import { Configuration, MailchainResult } from '../..';
import { CreateMailchainMessagingKeyIssuerError } from '../issuer';
import { VerifiablePresentationJWT } from '../jwt';
import { CredentialPayloadTypes } from '../payload';
import { MailchainAddressOwnershipIssuer } from './issuer';

export type CreateVerifiableMailchainAddressOwnerFromRequestError =
	| ValidateVerifiablePresentationRequestError
	| CreateMailchainMessagingKeyIssuerError;

export class VerifiableMailchainAddressOwnerCreator {
	constructor(
		private readonly signer: SignerWithPublicKey,
		private readonly mailchainAddressOwnershipIssuer: MailchainAddressOwnershipIssuer,
		private readonly mailchainAddressDomain: string,
	) {}

	static create(signer: SignerWithPublicKey, configuration: Configuration = defaultConfiguration) {
		return new VerifiableMailchainAddressOwnerCreator(
			signer,
			MailchainAddressOwnershipIssuer.create(configuration),
			configuration.mailchainAddressDomain,
		);
	}

	/**
	 * Creates a verifiable presentation JWT for a mailchain address owner.
	 * @param request - The verifiable presentation request containing the necessary information to create the JWT.
	 * @returns A promise that resolves to a MailchainResult containing either the verifiable presentation JWT or an error.
	 */
	async createVerifiableMailchainAddressOwner(
		request: VerifiablePresentationRequest,
	): Promise<MailchainResult<VerifiablePresentationJWT, CreateVerifiableMailchainAddressOwnerFromRequestError>> {
		const validationError = validateVerifiablePresentationRequest(request, this.mailchainAddressDomain);
		if (validationError) {
			return {
				error: validationError,
			};
		}
		const {
			requestId,
			from,
			to,
			actions,
			resources,
			signedCredentialExpiresAfter,
			signedCredentialExpiresAt,
			nonce,
		} = request;

		return this.mailchainAddressOwnershipIssuer.createVerifiableMailchainAddressOwnership({
			address: to,
			requester: from,
			actions,
			resources,
			signer: this.signer,
			options: {
				requestId,
				expiresAt: signedCredentialExpiresAt,
				expiresIn: signedCredentialExpiresAfter,
				nonce,
			},
		});
	}
}

export type ValidateVerifiablePresentationRequestError = ValidationError | ValidateAddressError;

export function validateVerifiablePresentationRequest(
	request: VerifiablePresentationRequest,
	mailchainAddressDomain: string,
): ValidateVerifiablePresentationRequestError | undefined {
	const {
		from: requestFrom,
		to: requestTo,
		actions,
		requestExpiresAfter,
		signedCredentialExpiresAt,
		signedCredentialExpiresAfter,
	} = request;

	if (CredentialPayloadTypes.indexOf(request.type) === -1) {
		return new ValidationError(`invalid type ${request.type}`);
	}

	if (request.version !== '1.0') {
		return new ValidationError(`invalid version ${request.version}`);
	}

	if (request.requestId == null || request.requestId.length === 0) {
		throw new ValidationError('requestId is empty');
	}

	if (requestExpiresAfter && signedCredentialExpiresAt && requestExpiresAfter > signedCredentialExpiresAt) {
		return new ValidationError('requestExpiresAfter must be before signedCredentialExpiresAt');
	}

	if (requestExpiresAfter instanceof Date && new Date() > requestExpiresAfter) {
		return new ValidationError('request has expired');
	}

	if (signedCredentialExpiresAt && signedCredentialExpiresAt < new Date()) {
		return new ValidationError('signed credential has expired');
	}

	if (signedCredentialExpiresAfter && signedCredentialExpiresAfter < 0) {
		return new ValidationError('signed credential signedCredentialExpiresAfter must be greater than 0');
	}

	if (actions.length === 0) {
		return new ValidationError('actions is empty');
	}

	if (request.resources.length === 0) {
		return new ValidationError('resources is empty');
	}

	const fromAddressError = checkAddressForErrors(requestFrom, mailchainAddressDomain);
	if (fromAddressError) {
		return fromAddressError;
	}

	const toAddressError = checkAddressForErrors(requestTo, mailchainAddressDomain);
	if (toAddressError) {
		return toAddressError;
	}

	if (request.approvedCallback.url.trim() === '') {
		return new ValidationError('approvedCallback.url is empty');
	}

	return undefined;
}
