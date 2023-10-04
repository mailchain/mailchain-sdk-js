import { Payload } from '../../transport/payload';
import { PayloadHeaders } from '../../transport/payload/headers';

export type VerifiablePresentationHeaders = PayloadHeaders<'application/vnd.mailchain.verified-credential-request'>;

export function isVerifiablePresentationHeaders(headers: PayloadHeaders): headers is VerifiablePresentationHeaders {
	return headers.ContentType === 'application/vnd.mailchain.verified-credential-request';
}

export type VerifiablePresentationPayload = Payload<VerifiablePresentationHeaders>;

export function isVerifiablePresentationPayload(payload: Payload): payload is VerifiablePresentationPayload {
	return isVerifiablePresentationHeaders(payload.Headers);
}
