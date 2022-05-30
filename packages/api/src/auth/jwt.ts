import { EncodeBase64UrlSafe } from '@mailchain/encoding';
import axios from 'axios';
import { KeyRing } from '@mailchain/keyring';

export const getToken = async (kr: KeyRing, payload: any, exp: number) => {
	const key = `${EncodeBase64UrlSafe(
		Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })),
	)}.${EncodeBase64UrlSafe(Buffer.from(JSON.stringify({ ...payload, exp })))}`;
	const signature = await kr.SignWithIdentityKey(key);

	return `${key}.${EncodeBase64UrlSafe(signature)}`;
};

let initializedInterceptorId: number | undefined = undefined;

export const initializeHeader = (kr: KeyRing) => {
	if (initializedInterceptorId != null) {
		console.warn('Header interceptor already initialized. Will do re-initialization. This should not be the case.');
		teardownHeaderInitialization();
	}
	const expires = Math.floor(Date.now() * 0.001 + 86400);
	initializedInterceptorId = axios.interceptors.request.use(async (request) => {
		const url = new URL(request?.url ?? '');
		const len = !['POST', 'PUT', 'PATCH'].some((m) => m === request.method?.toUpperCase())
			? 0
			: Buffer.byteLength(JSON.stringify(request.data), 'utf8');

		const payload = {
			m: request.method?.toUpperCase(),
			url: url.pathname,
			len,
			aud: url.host,
		};
		const token = await getToken(kr, payload, expires);
		if (request.headers) {
			request.headers.Authorization = `vapid t=${token}, k=${EncodeBase64UrlSafe(
				kr.rootIdentityPublicKey().Bytes,
			)}`;
		}
		return request;
	});
};

export const teardownHeaderInitialization = () => {
	if (initializedInterceptorId != null) {
		axios.interceptors.request.eject(initializedInterceptorId);
	}
};
