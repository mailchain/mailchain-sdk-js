import { EncodeBase64UrlSafe } from '@mailchain/encoding';
import axios from 'axios';
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

let initializedInterceptorId: number | undefined = undefined;

export const initializeHeader = (keyRing: KeyRing) => {
	if (initializedInterceptorId != null) {
		console.warn('Header interceptor already initialized. Will do re-initialization. This should not be the case.');
		teardownHeaderInitialization();
	}
	const expires = Math.floor(Date.now() * 0.001 + 86400);
	initializedInterceptorId = axios.interceptors.request.use(async (request) => {
		const requestKey = getKeyFromRequest(request, keyRing);
		if (!requestKey) {
			console.log('no requrest key');
			return request;
		}

		const url = new URL(request?.url ?? '');
		let len: number;
		// Taking code from https://github.com/axios/axios/blob/main/lib/adapters/http.js#L186-L198 to calculate content length how axios does it
		if (['POST', 'PUT', 'PATCH'].some((m) => m === request.method?.toUpperCase())) {
			if (Buffer.isBuffer(request.data)) {
				len = request.data.length;
			} else if (utils.isArrayBuffer(request.data)) {
				len = Buffer.byteLength(new Uint8Array(request.data));
			} else if (utils.isString(request.data)) {
				len = Buffer.byteLength(request.data, 'utf-8');
			} else {
				len = Buffer.byteLength(JSON.stringify(request.data));
			}
		} else {
			len = 0;
		}

		const payload = {
			m: request.method?.toUpperCase(),
			url: url.pathname,
			len,
			aud: url.host,
		};

		const token = await getToken(requestKey, payload, expires);
		if (request.headers) {
			request.headers.Authorization = `vapid t=${token}, k=${EncodeBase64UrlSafe(requestKey.publicKey.Bytes)}`;
		}
		return request;
	});
};

function getKeyFromRequest(request: any, keyRing: KeyRing): KeyFunctions | undefined {
	const url = new URL(request?.url ?? '');
	if (url.pathname.startsWith('/transport/delivery-requests')) {
		// needs to be expanded to support blockchain addresses registered with the keyring
		return keyRing.accountMessagingKey();
	} else if (url.pathname.startsWith('/user')) {
		return keyRing.accountIdentityKey();
	}

	// public method no need to sign
	return undefined;
}

export const teardownHeaderInitialization = () => {
	if (initializedInterceptorId != null) {
		axios.interceptors.request.eject(initializedInterceptorId);
	}
};
