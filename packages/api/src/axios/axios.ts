import { SignerWithPublicKey } from '@mailchain/crypto';
import axios, { AxiosInstance } from 'axios';
import { encodeBase64UrlSafe } from '@mailchain/encoding';
import { signJWT } from '../jwt';
import { createTokenPayload } from './token';

export const getAxiosWithSigner = (requestKey: SignerWithPublicKey): AxiosInstance => {
	const axiosInstance = axios.create();
	axiosInstance.interceptors.request.use(async (request) => {
		if (request.headers) {
			const expires = Math.floor(Date.now() / 1000 + 60 * 5); // 5 mins
			const tokenPayload = createTokenPayload(
				new URL(request?.url ?? ''),
				request.method?.toUpperCase() ?? '',
				request.data,
				expires,
			);
			const token = await signJWT(requestKey, tokenPayload);
			request.headers.Authorization = `vapid t=${token}, k=${encodeBase64UrlSafe(requestKey.publicKey.bytes)}`;
		}
		return request;
	});

	return axiosInstance;
};
