import { ProtocolType } from '@mailchain/addressing';

export type DecentralizedIdentifier<S extends string> =
	| MailchainDecentralizedIdentifier<S>
	| MailchainMessagingKeyDecentralizedIdentifier<S>;

export type MailchainDecentralizedIdentifier<S extends string> = `did:mailchain:${S}`;

export function mailchainAddressDecentralizedIdentifier<S extends string>(
	address: S,
): MailchainDecentralizedIdentifier<S> {
	return `did:mailchain:${encodeURIComponent(address) as S}`;
}

export type MailchainMessagingKeyDecentralizedIdentifier<S extends string> = `did:mailchain:${S}/messaging-key`;

export function mailchainMessagingKeyDecentralizedIdentifier<S extends string>(
	address: S,
): MailchainMessagingKeyDecentralizedIdentifier<S> {
	return `${mailchainAddressDecentralizedIdentifier(address)}/messaging-key`;
}

export type MailchainBlockchainAddressDecentralizedIdentifier<S extends string> = `did:mailchain:${ProtocolType}:${S}`;

export function mailchainBlockchainAddressDecentralizedIdentifier<S extends string>(
	protocol: ProtocolType,
	protocolAddress: S,
): MailchainBlockchainAddressDecentralizedIdentifier<S> {
	return `did:mailchain:${protocol}:${protocolAddress}`;
}
