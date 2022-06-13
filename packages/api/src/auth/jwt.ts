import { EncodeBase64UrlSafe } from '@mailchain/encoding';
import axios, { Axios, AxiosInstance } from 'axios';
import utils from 'axios/lib/utils';
import { KeyRing } from '@mailchain/keyring';
import { KeyFunctions } from '@mailchain/keyring/address';

export const getToken = async (requestKey: KeyFunctions, payload: any, exp: number) => {
	const key = `${EncodeBase64UrlSafe(
		Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })),
	)}.${EncodeBase64UrlSafe(Buffer.from(JSON.stringify({ ...payload, exp })))}`;
	const signature = await requestKey.sign(Buffer.from(key));

	return `${key}.${EncodeBase64UrlSafe(signature)}`;
};

export const getAxiosWithSigner = (kf: KeyFunctions): AxiosInstance => {
	const axiosInstance = axios.create();
	const expires = Math.floor(Date.now() * 0.001 + 86400);
	axiosInstance.interceptors.request.use(async (request) => {
		const payload = createPayload(new URL(request?.url ?? ''), request.method?.toUpperCase(), request.data);
		const token = await getToken(kf, payload, expires);
		if (request.headers) {
			request.headers.Authorization = `vapid t=${token}, k=${EncodeBase64UrlSafe(kf.publicKey.Bytes)}`;
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
	if (['POST', 'PUT', 'PATCH'].some((m) => m === method.toUpperCase())) {
		if (Buffer.isBuffer(data)) {
			len = data.length;
		} else if (utils.isArrayBuffer(data)) {
			len = Buffer.byteLength(new Uint8Array(data));
		} else if (utils.isString(data)) {
			len = Buffer.byteLength(data, 'utf-8');
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
