import { VerifiedPresentation, verifyPresentation } from 'did-jwt-vc';
import { defaultConfiguration } from '../../configuration';
import { ValidationError } from '../../errors/validation';
import { MailchainDIDMessagingKeyResolver } from '../resolver';
import { mailchainAddressDecentralizedIdentifier } from '../did';
import { Configuration, MailchainResult } from '../..';
import { CredentialSubject } from '../subject';
import { TermsOfUse } from '../termsOfUse';

export type VerifyMailchainAddressOwnershipParams = {
	presentation: string;
	verifier: string;
	nonce?: string;
	resources: string[];
	actions: string[];
	address: string;
};

export class VerificationError extends Error {
	constructor() {
		super('presentation failed to verify');
	}
}

export type VerifyMailchainAddressOwnershipError = VerificationError | ValidationError;

export class MailchainAddressOwnershipVerifier {
	constructor(private readonly mailchainDidResolver: MailchainDIDMessagingKeyResolver) {}

	static create(configuration: Configuration = defaultConfiguration) {
		return new MailchainAddressOwnershipVerifier(MailchainDIDMessagingKeyResolver.create(configuration));
	}

	async verifyMailchainAddressOwnership(
		params: VerifyMailchainAddressOwnershipParams,
	): Promise<MailchainResult<VerifiedPresentation, VerifyMailchainAddressOwnershipError>> {
		const { presentation, verifier, nonce, address, actions, resources } = params;
		const result = await verifyPresentation(presentation, this.mailchainDidResolver, {
			challenge: nonce,
			proofPurpose: 'authentication',
			audience: mailchainAddressDecentralizedIdentifier(verifier),
		});

		const { verified, verifiablePresentation } = result;

		if (!verified) {
			return {
				error: new VerificationError(),
			};
		}

		if (verifiablePresentation.holder != mailchainAddressDecentralizedIdentifier(address)) {
			return {
				error: new ValidationError('verified presentation holder address does not match'),
			};
		}

		if (!verifiablePresentation.verifiableCredential || verifiablePresentation.verifiableCredential.length === 0) {
			return {
				error: new ValidationError('verifiable credential not found'),
			};
		}

		const mailchainMessagingKeyCredentials = verifiablePresentation.verifiableCredential.filter(
			(vc) =>
				vc.type.some((x) => x === 'MailchainMessagingKeyCredential') &&
				vc.type.some((x) => x === 'VerifiableCredential'),
		);

		if (mailchainMessagingKeyCredentials.length === 0) {
			return {
				error: new ValidationError('missing MailchainMessagingKeyCredential'),
			};
		}

		if (mailchainMessagingKeyCredentials.length !== 1) {
			return {
				error: new ValidationError('more than one MailchainMessagingKeyCredential found'),
			};
		}

		const mailchainMessagingKeyCredential = mailchainMessagingKeyCredentials[0];

		const credentialSubjects = Object.keys(mailchainMessagingKeyCredential.credentialSubject).map(
			(key) => mailchainMessagingKeyCredential.credentialSubject[key],
		);

		if (credentialSubjects.length === 0) {
			return {
				error: new ValidationError('no credentialSubject found'),
			};
		}

		if (
			!credentialSubjects
				.filter((subject) => Object.keys(subject).some((x) => x === 'ownerOf'))
				.some((subject) => {
					const { ownerOf } = subject as CredentialSubject;
					return ownerOf.type === 'MailchainMessagingKey' && ownerOf.address === address;
				})
		) {
			return {
				error: new ValidationError('MailchainMessagingKey owner does not match supplied address'),
			};
		}

		if (!mailchainMessagingKeyCredential.termsOfUse) {
			return {
				error: new ValidationError('termsOfUse not found'),
			};
		}

		const verifyTermsOfUseError = verifyTermsOfUse(
			mailchainMessagingKeyCredential.termsOfUse,
			actions,
			resources,
			mailchainAddressDecentralizedIdentifier(address),
			mailchainAddressDecentralizedIdentifier(verifier),
		);
		if (verifyTermsOfUseError) {
			return { error: verifyTermsOfUseError };
		}

		return { data: result };
	}
}

function verifyTermsOfUse(
	termsOfUse: TermsOfUse[],
	requiredActions: string[],
	requiredResources: string[],
	requiredAssigner: string,
	requiredAssignee: string,
): VerificationError | undefined {
	if (termsOfUse.length !== 1) {
		return new ValidationError('credential must contain exactly 1 termOfUse');
	}

	// currently support a single term, multiple terms require coordinating checking terms and resources
	const term = termsOfUse[0];
	const { actions, resources, assignee, assigner } = term;

	if (!actions.includes('*') && !requiredActions.every((x) => actions.includes(x))) {
		return new ValidationError('not all required actions are met');
	}

	if (!resources.includes('*') && !requiredResources.every((x) => resources.includes(x))) {
		return new ValidationError('not all required resources are met');
	}

	if (assignee !== requiredAssignee) {
		return new ValidationError('termOfUse assignee incorrect');
	}

	if (assigner !== requiredAssigner) {
		return new ValidationError('termOfUse assigner incorrect');
	}

	return;
}
