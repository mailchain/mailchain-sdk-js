import { ProtocolType } from '@mailchain/addressing';

export type DecentralizedIdentifier<S extends string = string> =
	| MailchainDecentralizedIdentifier<S>
	| MailchainMessagingKeyDecentralizedIdentifier<S>;

export type MailchainDecentralizedIdentifier<S extends string = string> = `did:mailchain:${S}`;

export function mailchainAddressDecentralizedIdentifier(address: string): MailchainDecentralizedIdentifier {
	return `did:mailchain:${encodeURIComponent(address)}`;
}

export function isMailchainAddressDecentralizedIdentifier(did: string): did is MailchainDecentralizedIdentifier {
	return did.startsWith('did:mailchain:');
}

export function mailchainAddressFromDecentralizedIdentifier(did: MailchainDecentralizedIdentifier): string {
	return decodeURIComponent(did.replace('did:mailchain:', ''));
}

export type MailchainMessagingKeyDecentralizedIdentifier<S extends string = string> =
	`did:mailchain:${S}/messaging-key`;

export function mailchainMessagingKeyDecentralizedIdentifier(
	address: string,
): MailchainMessagingKeyDecentralizedIdentifier {
	return `${mailchainAddressDecentralizedIdentifier(address)}/messaging-key`;
}

export type MailchainBlockchainAddressDecentralizedIdentifier<
	P extends ProtocolType = ProtocolType,
	S extends string = string,
> = `did:mailchain:${P}:${S}`;

export function mailchainBlockchainAddressDecentralizedIdentifier<P extends ProtocolType, S extends string>(
	protocol: P,
	protocolAddress: S,
): MailchainBlockchainAddressDecentralizedIdentifier<P, S> {
	return `did:mailchain:${protocol}:${protocolAddress}`;
}
