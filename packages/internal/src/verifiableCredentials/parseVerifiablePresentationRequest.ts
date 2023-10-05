import { VerifiablePresentationRequest } from './request';

export function parseVerifiablePresentationRequest(json: string): VerifiablePresentationRequest {
	const raw = JSON.parse(json);

	return {
		...raw,
		signedCredentialExpiresAt:
			raw.signedCredentialExpiresAt != null ? new Date(raw.signedCredentialExpiresAt) : undefined,
		requestExpiresAfter: raw.requestExpiresAfter != null ? new Date(raw.requestExpiresAfter) : undefined,
	};
}
