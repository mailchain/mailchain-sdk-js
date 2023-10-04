import { PresentationPayload, VerifiableCredential } from 'did-jwt-vc';
import { DecentralizedIdentifier, MailchainDecentralizedIdentifier } from './did';
import { W3C_CREDENTIALS_CONTEXT } from './context';

type CreatePresentationPayloadParams = {
	id?: string;
	verifiableCredential: VerifiableCredential;
	verifier: DecentralizedIdentifier;
	issuanceDate: Date;
	/**
	 * The date and time that the credential will expire.
	 */
	expirationDate?: Date;
	holder: MailchainDecentralizedIdentifier;
};

/**
 * Create presentation payload that is then signed to create a verified presentation.
 * @param params
 * @returns
 */
export function createPresentationPayload(params: CreatePresentationPayloadParams): PresentationPayload {
	const { verifiableCredential, verifier, issuanceDate, expirationDate, holder, id } = params;

	return {
		'@context': [W3C_CREDENTIALS_CONTEXT],
		type: ['VerifiablePresentation'],
		id,
		holder,
		verifiableCredential: [verifiableCredential],
		verifier,
		issuanceDate: issuanceDate.toUTCString(),
		expirationDate: expirationDate ? expirationDate.toUTCString() : undefined,
	};
}
