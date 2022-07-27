import { AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { PrivateKeyDecrypter } from '@mailchain/crypto/cipher/nacl/private-key-decrypter';
import { DecodeBase64, EncodeBase64 } from '@mailchain/encoding';
import Axios from 'axios';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from '../types';
import { AuthenticatedResponse } from './response';

export class LoginError extends Error {
	constructor(public readonly kind: 'invalid-username' | 'failed-auth' | 'network-error', details: string) {
		super(`${kind} - ${details}`);
	}
}

export async function AccountAuthInit(
	username: string,
	password: string,
	captchaResponse: string,
	authApi: AuthApiInterface,
	opaqueClient: AuthClient,
): Promise<{
	state: Uint8Array;
	keyExchange2: Uint8Array;
}> {
	const keyExchange1 = await opaqueClient.authInit(password);
	if (keyExchange1 instanceof Error) {
		throw new LoginError('failed-auth', 'failed keyExchange1');
	}

	const response = await authApi
		.accountAuthInit({
			username,
			params: EncodeBase64(Uint8Array.from(keyExchange1.serialize())),
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
		state: DecodeBase64(response.data.state),
		keyExchange2: DecodeBase64(response.data.authStartResponse),
	};
}

export async function AccountAuthFinalize(
	username: string,
	keyExchange2: KE2,
	authState: Uint8Array,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
): Promise<AuthenticatedResponse> {
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
		params: EncodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: EncodeBase64(authState),
	});

	if (response.status !== 200) {
		throw new LoginError('failed-auth', 'failed authFinish, non 200 status');
	}

	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const decrypter = PrivateKeyDecrypter.fromPrivateKey(encryptionKey);

	const decryptedAccountSeed = await decrypter.decrypt(
		DecodeBase64(response.data.encryptedAccountSeed.encryptedAccountSeed),
	);

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		sessionKey: DecodeBase64(response.data.session),
		rootAccountKey: ED25519PrivateKey.fromSeed(decryptedAccountSeed),
	};
}
