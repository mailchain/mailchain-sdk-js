import { decodeBase64UrlSafe, decodeUtf8, encodeBase64UrlSafe, encodeUtf8 } from '@mailchain/encoding';
import { ED25519PublicKey, SignerWithPublicKey } from '@mailchain/crypto';
import canonicalize from 'canonicalize';
import { TokenPayload } from './token';

export async function signJWT(signer: SignerWithPublicKey, payload: TokenPayload, expires: number): Promise<string> {
	const canonicalizedHeader = canonicalize({ alg: 'EdDSA', typ: 'JWT' });
	if (!canonicalizedHeader) {
		throw new Error('header could not be canonicalized');
	}

	const canonicalizedPayload = canonicalize({ ...payload, exp: expires });
	if (!canonicalizedPayload) {
		throw new Error('payload could not be canonicalized');
	}

	const headerSegment = encodeBase64UrlSafe(decodeUtf8(canonicalizedHeader));
	const payloadSegment = encodeBase64UrlSafe(decodeUtf8(canonicalizedPayload));

	const headerAndSegment = `${headerSegment}.${payloadSegment}`;
	const signedToken = await signer.sign(decodeUtf8(headerAndSegment));
	const signatureSegment = encodeBase64UrlSafe(signedToken);

	return `${headerAndSegment}.${signatureSegment}`;
}

export async function verifyJWT(token: string, publicKey: ED25519PublicKey): Promise<boolean> {
	const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
	if (!headerSegment || !payloadSegment || !signatureSegment) {
		return false;
	}

	const header = JSON.parse(encodeUtf8(decodeBase64UrlSafe(headerSegment)));
	if (header.alg !== 'EdDSA') {
		return false;
	}

	const headerAndSegment = `${headerSegment}.${payloadSegment}`;
	const signature = decodeBase64UrlSafe(signatureSegment);

	return publicKey.verify(decodeUtf8(headerAndSegment), signature);
}
