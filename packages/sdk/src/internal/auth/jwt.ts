import { encodeBase64UrlSafe } from '@mailchain/encoding';
import axios, { AxiosInstance } from 'axios';
import utils from 'axios/lib/utils';
import { SignerWithPublicKey } from '@mailchain/crypto';

export const getToken = async (requestKey: SignerWithPublicKey, payload: TokenPayload, exp: number) => {
	const headerSegment = encodeBase64UrlSafe(Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })));
	const payloadSegment = encodeBase64UrlSafe(Buffer.from(JSON.stringify({ ...payload, exp })));

	const key = `${headerSegment}.${payloadSegment}`;
	const signedKey = await requestKey.sign(Buffer.from(key));
	const signatureSegment = encodeBase64UrlSafe(signedKey);

	return `${key}.${signatureSegment}`;
};

export const getAxiosWithSigner = (requestKey: SignerWithPublicKey): AxiosInstance => {
	const axiosInstance = axios.create();
	axiosInstance.interceptors.request.use(async (request) => {
		if (request.headers) {
			const expires = Math.floor(Date.now() / 1000 + 60 * 60 * 24); // 1 day from now
			const tokenPayload = createTokenPayload(
				new URL(request?.url ?? ''),
				request.method?.toUpperCase() ?? '',
				request.data,
			);
			const token = await getToken(requestKey, tokenPayload, expires);
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

export function createTokenPayload(url: URL, method: string, data: any): TokenPayload {
	let len: number;
	// Taking code from https://github.com/axios/axios/blob/main/lib/adapters/http.js#L186-L198 to calculate content length how axios does it
	if (data != null && ['POST', 'PUT', 'PATCH'].some((m) => m === method.toUpperCase())) {
		if (Buffer.isBuffer(data)) {
			len = data.length;
		} else if (utils.isArrayBuffer(data)) {
			len = Buffer.byteLength(new Uint8Array(data));
		} else if (utils.isString(data)) {
			len = Buffer.byteLength(data, 'utf-8');
		} else if (toString.call(data) === '[object Uint8Array]') {
			len = data.length;
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
