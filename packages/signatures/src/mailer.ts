import { encodePublicKey, PublicKey, Signer } from '@mailchain/crypto';
import { decodeUtf8, encodeHex } from '@mailchain/encoding';
import canonicalize from 'canonicalize';
import { signRawEd25519, verifyRawEd25519 } from './raw_ed25519';

export type MailerProofParams = {
	authorContentSignature: Uint8Array;
	expires: Date;
	mailerMessagingKey: PublicKey;
};

export type MailerProof = {
	params: MailerProofParams;
	signature: Uint8Array;
	version: string;
};

export function createMailerProofSigningData(mailerProofParams: MailerProofParams, version: string): string {
	switch (version) {
		case '1.0':
			const canonicalized = canonicalize({
				authorContentSignature: encodeHex(mailerProofParams.authorContentSignature),
				expires: Math.round(mailerProofParams.expires.getTime() / 1000),
				mailerMessagingKey: encodeHex(encodePublicKey(mailerProofParams.mailerMessagingKey)),
			});

			if (!canonicalized) {
				throw new Error('content could not be canonicalized');
			}

			return canonicalized;
		default:
			throw new Error(`version ${version} is not supported`);
	}
}

export async function signMailerProofParams(
	author: Signer,
	mailerProofParams: MailerProofParams,
	version: string,
): Promise<Uint8Array> {
	return signRawEd25519(author, decodeUtf8(createMailerProofSigningData(mailerProofParams, version)));
}

export async function createMailerProof(
	author: Signer,
	mailerProofParams: MailerProofParams,
	version: string,
): Promise<MailerProof> {
	const signature = await signMailerProofParams(author, mailerProofParams, version);
	return {
		params: mailerProofParams,
		signature,
		version,
	};
}

export async function verifyMailerProof(author: PublicKey, mailerProof: MailerProof): Promise<Boolean> {
	return verifyRawEd25519(
		author,
		Buffer.from(createMailerProofSigningData(mailerProof.params, mailerProof.version)),
		mailerProof.signature,
	);
}
