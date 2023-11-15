import { decodeUtf8, encodeBase64UrlSafe } from '@mailchain/encoding';
import isArrayBuffer from 'lodash/isArrayBuffer.js';
import { sha3_256 } from '@noble/hashes/sha3';

export type TokenPayload = {
	/** The HTTP method */
	m: string;
	/** pathname */
	url: string;
	/** The length of the data payload of the request  */
	len?: number;
	/** hash of the body */
	bodyHash?: string;
	/** host */
	aud: string;
	/** query params */
	q?: string;
};

function asBuffer(data: unknown): Buffer | undefined {
	if (data === undefined) {
		return undefined;
	} else if (Buffer.isBuffer(data)) {
		return data as Buffer;
	} else if (isArrayBuffer(data)) {
		return Buffer.from(data as ArrayBuffer);
	} else if (typeof data === 'string') {
		return Buffer.from(decodeUtf8(data as string));
	} else if (toString.call(data) === '[object Uint8Array]') {
		return Buffer.from(data as Uint8Array);
	}
	return Buffer.from(decodeUtf8(JSON.stringify(data)));
}
export function createTokenPayload(url: URL, method: string, data: unknown, expires: number): TokenPayload {
	const basePayload = {
		m: method.toUpperCase(),
		url: url.pathname,
		aud: url.host,
		exp: expires,
	} as TokenPayload;

	// there is a difference when hashing when the q field is missing vs undefined
	const withQuery = url.search.length > 1 ? { ...basePayload, q: url.search.replace(/^\?/, '') } : basePayload;

	if (!['POST', 'PUT', 'PATCH'].some((m) => m === method.toUpperCase())) {
		return withQuery;
	}

	const buf = asBuffer(data);
	if (!buf) {
		return withQuery;
	}

	return {
		len: buf.length,
		bodyHash: encodeBase64UrlSafe(sha3_256(buf)),
		...withQuery,
	};
}
