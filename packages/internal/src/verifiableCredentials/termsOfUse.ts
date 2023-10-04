import { DecentralizedIdentifier } from './did';

export type TermsOfUse = {
	type: 'IssuerPolicy' | 'HolderPolicy';
	id?: string;
	effect: 'Allow' | 'Deny';
	/**
	 *	assigner formatted as a {@link DecentralizedIdentifier}, is who is defining the terms of use. Often assigner is the issuer of the credential, however it may be another identity.
	 */
	assigner: DecentralizedIdentifier;
	/**
	 * assigner formatted as a {@link DecentralizedIdentifier}, is who the terms of use is intended for.
	 */
	assignee: DecentralizedIdentifier;
	actions: string[];
	resources: string[];
};
