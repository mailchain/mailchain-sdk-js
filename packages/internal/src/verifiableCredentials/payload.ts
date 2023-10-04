import { VerifiableCredential } from 'did-jwt-vc';
import { Proof } from 'did-jwt-vc/lib/types';
import { DecentralizedIdentifier } from './did';
import { TermsOfUse } from './termsOfUse';
import { CredentialSubject } from './subject';
import { W3C_CREDENTIALS_CONTEXT } from './context';

const MailchainMessagingKeyCredential = 'MailchainMessagingKeyCredential';
export const CredentialPayloadTypes = [MailchainMessagingKeyCredential] as const;
export type CredentialPayloadType = (typeof CredentialPayloadTypes)[number];

type CreateVerifiableCredentialParams = {
	type: CredentialPayloadType;
	credentialSubjects: CredentialSubject[];
	issuanceDate: Date;
	issuerId: DecentralizedIdentifier<string>;
	termsOfUse: TermsOfUse[];
	proof: Proof;
};

/**
 * Creates a verifiable credential using a provided proof instead of signature.
 */
export function createVerifiableCredential(params: CreateVerifiableCredentialParams): VerifiableCredential {
	const { type, credentialSubjects, issuanceDate, issuerId, proof, termsOfUse } = params;

	return {
		'@context': [W3C_CREDENTIALS_CONTEXT],
		credentialSubject: credentialSubjects,
		type: ['VerifiableCredential', type],
		issuanceDate: issuanceDate.toISOString(),
		issuer: {
			id: issuerId,
		},
		termsOfUse,
		proof,
	};
}
