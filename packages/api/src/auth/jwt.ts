import { decodeBase64UrlSafe, decodeUtf8, encodeBase64UrlSafe, encodeUtf8 } from '@mailchain/encoding';
import axios, { AxiosInstance } from 'axios';
import { ED25519PublicKey, SignerWithPublicKey } from '@mailchain/crypto';
import isArrayBuffer from 'lodash/isArrayBuffer';

export async function createSignedToken(
	requestKey: SignerWithPublicKey,
	payload: TokenPayload,
	exp: number,
): Promise<string> {
	const headerSegment = encodeBase64UrlSafe(decodeUtf8(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })));
	const payloadSegment = encodeBase64UrlSafe(decodeUtf8(JSON.stringify({ ...payload, exp })));

	const headerAndSegment = `${headerSegment}.${payloadSegment}`;
	const signedToken = await requestKey.sign(decodeUtf8(headerAndSegment));
	const signatureSegment = encodeBase64UrlSafe(signedToken);

	return `${headerAndSegment}.${signatureSegment}`;
}

export async function verifySignedToken(token: string, publicKey: ED25519PublicKey): Promise<boolean> {
	const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
	if (!headerSegment || !payloadSegment || !signatureSegment) {
		return false;
	}

	const header = JSON.parse(encodeUtf8(decodeBase64UrlSafe(headerSegment)));
	const signature = decodeBase64UrlSafe(signatureSegment);

	if (header.alg !== 'EdDSA') {
		return false;
	}
	const headerAndSegment = `${headerSegment}.${payloadSegment}`;

	return publicKey.verify(decodeUtf8(headerAndSegment), signature);
}

export const getAxiosWithSigner = (requestKey: SignerWithPublicKey): AxiosInstance => {
	const axiosInstance = axios.create();
	axiosInstance.interceptors.request.use(async (request) => {
		if (request.headers) {
			const expires = Math.floor(Date.now() / 1000 + 60 * 5); // 5 mins
			const tokenPayload = createTokenPayload(
				new URL(request?.url ?? ''),
				request.method?.toUpperCase() ?? '',
				request.data,
			);
			const token = await createSignedToken(requestKey, tokenPayload, expires);
			request.headers.Authorization = `vapid t=${token}, k=${encodeBase64UrlSafe(requestKey.publicKey.bytes)}`;
		}
		return request;
	});

	return axiosInstance;
};

type TokenPayload = {
	/** The HTTP method */
	m: string;
	/** pathname */
	url: string;
	/** The length of the data payload of the request  */
	len: number;
	/** host */
	aud: string;
	/** query params */
	q?: string;
};

export function createTokenPayload(url: URL, method: string, data: unknown): TokenPayload {
	let len: number;
	// Taking code from https://github.com/axios/axios/blob/main/lib/adapters/http.js#L186-L198 to calculate content length how axios does it
	if (data != null && ['POST', 'PUT', 'PATCH'].some((m) => m === method.toUpperCase())) {
		if (Buffer.isBuffer(data)) {
			len = data.length;
		} else if (isArrayBuffer(data)) {
			len = Buffer.byteLength(new Uint8Array(data));
		} else if (typeof data === 'string') {
			len = Buffer.byteLength(data, 'utf-8');
		} else if (toString.call(data) === '[object Uint8Array]') {
			len = (data as Uint8Array).length;
		} else {
			len = Buffer.byteLength(JSON.stringify(data));
		}
	} else {
		len = 0;
	}

	return {
		m: method.toUpperCase(),
		url: url.pathname,
		len,
		aud: url.host,
		q: url.search.length > 1 ? url.search.replace(/^\?/, '') : undefined,
	};
}
