import { SignerWithPublicKey, isPublicKeyEqual } from '@mailchain/crypto';
import { decodeUtf8, encodeBase64UrlSafe } from '@mailchain/encoding';
import { Issuer } from 'did-jwt-vc';
import { ProvidedMessagingKeyIncorrectError } from '@mailchain/signatures';
import { UnexpectedMailchainError } from '../errors';
import { MailchainResult } from '../mailchainResult';
import { RegisteredResolvedAddress } from '../messagingKeys';
import { mailchainAddressDecentralizedIdentifier } from './did';

export type CreateMailchainMessagingKeyIssuerError = UnexpectedMailchainError | ProvidedMessagingKeyIncorrectError;
export type CreateIssuerFromResolvedAddress = {
	/**
	 * Resolved address signer will be created for. Resolved address public key must match signer public key.
	 */
	resolvedAddress: RegisteredResolvedAddress;
	/**
	 * Signer must match resolved address public key. Used to sign issued credentials.
	 */
	signer: SignerWithPublicKey;
};

export class MailchainMessagingKeyIssuer {
	async createIssuerFromResolvedAddress(
		params: CreateIssuerFromResolvedAddress,
	): Promise<MailchainResult<Issuer, CreateMailchainMessagingKeyIssuerError>> {
		const { resolvedAddress, signer } = params;

		if (!isPublicKeyEqual(resolvedAddress.messagingKey, signer.publicKey)) {
			return {
				error: new ProvidedMessagingKeyIncorrectError('signer'),
			};
		}

		return {
			data: createIssuerFromSigner(resolvedAddress.mailchainAddress, signer),
		};
	}
}

export function createIssuerFromSigner(mailchainAddress: string, signer: SignerWithPublicKey): Issuer {
	return {
		did: mailchainAddressDecentralizedIdentifier(mailchainAddress),
		alg: 'Ed25519',
		signer: async (data: string | Uint8Array): Promise<string> => {
			const dataBytes: Uint8Array = typeof data === 'string' ? decodeUtf8(data) : data;
			const signature = await signer.sign(dataBytes);
			return encodeBase64UrlSafe(signature);
		},
	};
}
