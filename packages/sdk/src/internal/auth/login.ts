import { AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey, PrivateKeyDecrypter } from '@mailchain/crypto';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import Axios from 'axios';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from './opaque';
import { AuthenticatedResponse } from './response';

export class LoginError extends Error {
	constructor(public readonly kind: 'invalid-username' | 'failed-auth' | 'network-error', details: string) {
		super(`${kind} - ${details}`);
	}
}

export async function accountAuthInit(
	username: string,
	password: string,
	captchaResponse: string,
	authApi: AuthApiInterface,
	opaqueClient: AuthClient,
): Promise<{
	state: Uint8Array;
	keyExchange2: Uint8Array;
}> {
	username = username.trim().toLowerCase();
	const keyExchange1 = await opaqueClient.authInit(password);
	if (keyExchange1 instanceof Error) {
		throw new LoginError('failed-auth', 'failed keyExchange1');
	}

	const response = await authApi
		.accountAuthInit({
			username,
			params: encodeBase64(Uint8Array.from(keyExchange1.serialize())),
			captchaResponse,
		})
		.catch((e) => {
			if (Axios.isAxiosError(e) && e.response?.data?.message === 'username not found') {
				throw new LoginError('invalid-username', 'auth init');
			}
			throw e;
		});

	if (response.status !== 200) {
		throw new LoginError('failed-auth', 'non 200 response status');
	}

	return {
		state: decodeBase64(response.data.state),
		keyExchange2: decodeBase64(response.data.authStartResponse),
	};
}

export async function accountAuthFinalize(
	username: string,
	keyExchange2: KE2,
	authState: Uint8Array,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
): Promise<AuthenticatedResponse> {
	username = username.trim().toLowerCase();
	const authFinishResponse = await opaqueClient.authFinish(
		keyExchange2,
		opaqueConfig.serverIdentity,
		username,
		opaqueConfig.context,
	);
	if (authFinishResponse instanceof Error) {
		throw new LoginError('failed-auth', 'failed authFinish');
	}

	const response = await authApi.accountAuthFinalize({
		params: encodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: encodeBase64(authState),
	});

	if (response.status !== 200) {
		throw new LoginError('failed-auth', 'failed authFinish, non 200 status');
	}

	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const decrypter = PrivateKeyDecrypter.fromPrivateKey(encryptionKey);

	const decryptedAccountSeed = await decrypter.decrypt(
		decodeBase64(response.data.encryptedAccountSeed.encryptedAccountSeed),
	);

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		localStorageSessionKey: decodeBase64(response.data.localStorageSessionKey),
		rootAccountKey: ED25519PrivateKey.fromSeed(decryptedAccountSeed),
	};
}
