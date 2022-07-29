import { EncodeBase64UrlSafe } from '@mailchain/encoding';
import axios, { AxiosInstance } from 'axios';
import utils from 'axios/lib/utils';
import { SignerWithPublicKey } from '@mailchain/crypto';

export const getToken = async (requestKey: SignerWithPublicKey, payload: any, exp: number) => {
	const key = `${EncodeBase64UrlSafe(
		Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })),
	)}.${EncodeBase64UrlSafe(Buffer.from(JSON.stringify({ ...payload, exp })))}`;
	const signature = await requestKey.sign(Buffer.from(key));

	return `${key}.${EncodeBase64UrlSafe(signature)}`;
};

export const getAxiosWithSigner = (requestKey: SignerWithPublicKey): AxiosInstance => {
	const axiosInstance = axios.create();
	axiosInstance.interceptors.request.use(async (request) => {
		const expires = Math.floor(Date.now() / 1000 + 60 * 60 * 24); // 1 day from now
		const payload = createPayload(new URL(request?.url ?? ''), request.method?.toUpperCase(), request.data);
		const token = await getToken(requestKey, payload, expires);
		if (request.headers) {
			request.headers.Authorization = `vapid t=${token}, k=${EncodeBase64UrlSafe(requestKey.publicKey.bytes)}`;
		}
		return request;
	});

	return axiosInstance;
};

export function createPayload(
	url,
	method,
	data,
): {
	m: string;
	url: string;
	len: number;
	aud: string;
} {
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
	};
}
