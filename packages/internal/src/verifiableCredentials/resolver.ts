import { encodeHex } from '@mailchain/encoding';
import { DIDResolutionOptions, DIDResolutionResult, Resolvable } from 'did-resolver';
import { MessagingKeys, ResolvedAddress } from '../messagingKeys';
import { Configuration } from '../configuration';

export class MailchainDIDMessagingKeyResolver implements Resolvable {
	constructor(private readonly messagingKeys: MessagingKeys) {}
	static create(configuration: Configuration) {
		return new MailchainDIDMessagingKeyResolver(MessagingKeys.create(configuration));
	}
	async resolve(didUrl: string, _options?: DIDResolutionOptions): Promise<DIDResolutionResult> {
		const address = didUrl.replace('did:mailchain:', '');
		const { data: resolvedAddress, error: resolveAddressError } = await this.messagingKeys.resolve(address);
		if (resolveAddressError) {
			throw resolveAddressError;
		}

		return createDidDocumentFromResolvedAddress(didUrl, resolvedAddress);
	}
}

export function createDidDocumentFromResolvedAddress(
	didUrl: string,
	resolvedAddress: ResolvedAddress,
): DIDResolutionResult {
	return {
		didDocument: {
			id: didUrl,
			authentication: [
				{
					id: `${didUrl}/messaging-key`,
					controller: didUrl,
					type: 'ED25519SignatureVerification',
					publicKeyHex: `${encodeHex(resolvedAddress.messagingKey.bytes)}`,
				},
			],
			verificationMethod: [], // no verification methods
		},
		didDocumentMetadata: {
			canonicalId: didUrl,
		},
		didResolutionMetadata: {
			contentType: 'application/did+ld+json',
		},
	};
}
