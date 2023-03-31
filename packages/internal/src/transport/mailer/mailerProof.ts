import { decodePublicKey, encodePublicKey } from '@mailchain/crypto';
import { decodeHex, encodeHex } from '@mailchain/encoding';
import { MailerProof } from '@mailchain/signatures';
import canonicalize from 'canonicalize';

export function createMailerProofBuffer(mailerProof: MailerProof): string {
	// fields are alphabetically ordered
	const canonicalized = canonicalize({
		params: {
			authorContentSignature: encodeHex(mailerProof.params.authorContentSignature),
			expires: Math.round(mailerProof.params.expires.getTime()),
			mailerMessagingKey: encodeHex(encodePublicKey(mailerProof.params.mailerMessagingKey)),
		},
		signature: encodeHex(mailerProof.signature),
		version: mailerProof.version,
	});

	if (!canonicalized) {
		throw new Error('content could not be canonicalized');
	}

	return canonicalized;
}

export function parseMailerProofFromJSON(content: string): MailerProof {
	type RawMailerProof = {
		params: {
			expires: number;
			mailerMessagingKey: string;
			authorContentSignature: string;
		};
		signature: string;
		version: string;
	};

	const rawRawMailerProof: RawMailerProof = JSON.parse(content);

	if (!rawRawMailerProof.params) {
		throw new Error('mailerProof.params is required');
	}

	if (rawRawMailerProof.params.authorContentSignature === '') {
		throw new Error('authorContentSignature is required');
	}

	const authorContentSignature = decodeHex(rawRawMailerProof.params.authorContentSignature);

	if (rawRawMailerProof.params.mailerMessagingKey === '') {
		throw new Error('mailerMessagingKey is required');
	}

	return {
		params: {
			expires: new Date(rawRawMailerProof.params.expires),
			mailerMessagingKey: decodePublicKey(decodeHex(rawRawMailerProof.params.mailerMessagingKey)),
			authorContentSignature,
		},
		signature: decodeHex(rawRawMailerProof.signature),
		version: rawRawMailerProof.version,
	};
}
