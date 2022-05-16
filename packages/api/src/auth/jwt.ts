import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { EncodeBase64, EncodeBase64UrlSafe } from '@mailchain/encoding';
import axios from 'axios';

export const getToken = async (secret, payload: any, exp: number) => {
	const key = `${EncodeBase64UrlSafe(
		Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })),
	)}.${EncodeBase64UrlSafe(Buffer.from(JSON.stringify({ ...payload, exp })))}`;
	const signature = EncodeBase64UrlSafe(await ED25519PrivateKey.FromSecretKey(secret).Sign(Buffer.from(key)));

	return `${key}.${signature}`;
};

export const initializeHeader = (key: ED25519PrivateKey) => {
	const expires = Math.floor(Date.now() * 0.001 + 86400);
	axios.interceptors.request.use(async (request) => {
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
		const token = await getToken(key.KeyPair.secretKey, payload, expires);
		if (request.headers) {
			request.headers.Authorization = `vapid t=${token}, k=${EncodeBase64(key.KeyPair.publicKey)}`;
		}

		return request;
	});
};
