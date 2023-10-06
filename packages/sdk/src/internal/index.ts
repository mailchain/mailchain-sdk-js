export { MailSender } from '@mailchain/internal/sending/mail';
export { getMessagingKeyLatestNonce } from './addressNonce';
export { resolveAddress } from './resolvers';
export { getPrivateMessagingKey } from './privateMessagingKey';
export type { ResolvedAddress, ResolveAddressError, ResolveAddressResult } from '@mailchain/internal/messagingKeys';
export * from './keys';

// VC Request
export { MailchainAddressOwnershipVerifier } from '@mailchain/internal/verifiableCredentials';
export { VerifiablePresentationRequestSender } from '@mailchain/internal/sending/verifiablePresentationRequest';
export type {
	VerifiablePresentationRequest,
	CredentialPayloadType,
	VerifyMailchainAddressOwnershipParams,
	VerifyMailchainAddressOwnershipError,
} from '@mailchain/internal/verifiableCredentials';
export type {
	SentVerifiablePresentationRequest,
	SendVerifiablePresentationRequestError,
} from '@mailchain/internal/sending/verifiablePresentationRequest';
