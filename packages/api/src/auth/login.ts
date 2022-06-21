import { OpaqueClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { PrivateKey } from '@mailchain/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { PrivateKeyDecrypter } from '@mailchain/crypto/cipher/nacl/private-key-decrypter';
import { DecodeBase64, EncodeBase64 } from '@mailchain/encoding';
import Axios from 'axios';
import { AuthApiFactory, Configuration } from '../api';
import { OpaqueConfig } from '../types';
import { AuthenticatedResponse } from './response';
import { DefaultConfig } from './config';

export class LoginError extends Error {
	constructor(public readonly kind: 'invalid-username' | 'failed-auth' | 'network-error', details: string) {
		super(`${kind} - ${details}`);
	}
}

export async function Login(
	username: string,
	password: string,
	captchaResponse: string,
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig = DefaultConfig,
): Promise<AuthenticatedResponse> {
	try {
		const authClient: AuthClient = new OpaqueClient(opaqueConfig.parameters);

		const authInitResponse = await AccountAuthInit(
			apiConfig,
			opaqueConfig,
			authClient,
			username,
			password,
			captchaResponse,
		);
		const keyExchange2 = KE2.deserialize(opaqueConfig.parameters, Array.from(authInitResponse.keyExchange2));
		return AccountAuthFinalize(apiConfig, opaqueConfig, authClient, username, keyExchange2, authInitResponse.state);
	} catch (e) {
		if (Axios.isAxiosError(e)) {
			throw new LoginError('network-error', 'axios network error');
		}
		throw e;
	}
}

async function AccountAuthInit(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
	username: string,
	password: string,
	captchaResponse: string,
): Promise<{
	state: Uint8Array;
	keyExchange2: Uint8Array;
}> {
	const keyExchange1 = await opaqueClient.authInit(password);
	if (keyExchange1 instanceof Error) {
		throw new LoginError('failed-auth', 'failed keyExchange1');
	}

	const response = await AuthApiFactory(apiConfig)
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

async function AccountAuthFinalize(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
	username: string,
	keyExchange2: KE2,
	authState: Uint8Array,
): Promise<{
	clientSecretKey: Uint8Array;
	sessionKey: Uint8Array;
	identityKey: PrivateKey;
}> {
	const authFinishResponse = await opaqueClient.authFinish(
		keyExchange2,
		opaqueConfig.serverIdentity,
		username,
		opaqueConfig.context,
	);
	if (authFinishResponse instanceof Error) {
		throw new LoginError('failed-auth', 'failed authFinish');
	}

	const response = await AuthApiFactory(apiConfig).accountAuthFinalize({
		params: EncodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: EncodeBase64(authState),
	});

	if (response.status !== 200) {
		throw new LoginError('failed-auth', 'failed authFinish, non 200 status');
	}

	// TODO: this is not the production key create but will do for testing
	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.FromSeed(seed);
	const decrypter = PrivateKeyDecrypter.FromPrivateKey(encryptionKey);
	// TODO: this is not the production data type but will be suffient for testing

	const decryptedAccountSeed = await decrypter.Decrypt(
		DecodeBase64(response.data.encryptedAccountSeed.encryptedAccountSeed),
	);

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		sessionKey: DecodeBase64(response.data.session),
		identityKey: ED25519PrivateKey.FromSeed(decryptedAccountSeed),
	};
}
