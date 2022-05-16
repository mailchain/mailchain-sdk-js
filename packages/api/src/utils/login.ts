import { OpaqueClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { PrivateKey } from '@mailchain/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';

import { PrivateKeyDecrypter } from '@mailchain/crypto/cipher/nacl/private-key-decrypter';
import { DecodeBase64, EncodeBase64 } from '@mailchain/encoding';
import { DecodePrivateKey } from '@mailchain/crypto/multikey/encoding';
import { AuthApiFactory, Configuration } from '../api';
import { OpaqueConfig } from '../types';

export async function Login(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	identityKey: PrivateKey,
	username: string,
	password: string,
	errorExpected: boolean,
): Promise<{
	clientSecretKey: Uint8Array;
	sessionKey: Uint8Array;
	identityKey: PrivateKey;
}> {
	const authClient: AuthClient = new OpaqueClient(opaqueConfig.parameters);

	const authInitResponse = await AccountAuthInit(
		apiConfig,
		opaqueConfig,
		authClient,
		username,
		password,
		errorExpected,
	);
	const keyExchange2 = KE2.deserialize(opaqueConfig.parameters, Array.from(authInitResponse.keyExchange2));
	return AccountAuthFinalize(
		apiConfig,
		opaqueConfig,
		authClient,
		username,
		keyExchange2,
		authInitResponse.state,
		errorExpected,
	);
}

async function AccountAuthInit(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
	username: string,
	password: string,
	errorExpected: boolean,
): Promise<{
	state: Uint8Array;
	keyExchange2: Uint8Array;
}> {
	const keyExchange1 = await opaqueClient.authInit(password);
	if (keyExchange1 instanceof Error) {
		throw new Error(`client failed to authInit: ${keyExchange1}`);
	}
	const response = await AuthApiFactory(apiConfig).accountAuthInit({
		username,
		params: EncodeBase64(Uint8Array.from(keyExchange1.serialize())),
	});

	if (response.status !== 200 && !errorExpected) {
		throw new Error('unexpected error');
	}

	if (response.status !== 200) {
		return {
			state: new Uint8Array(),
			keyExchange2: new Uint8Array(),
		};
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
	errorExpected: boolean,
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
		throw new Error(`client failed to authFinish: ${authFinishResponse}`);
	}

	// const expectedSessionKey = authFinishResponse.session_key;

	const response = await AuthApiFactory(apiConfig).accountAuthFinalize({
		params: EncodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: EncodeBase64(authState),
	});

	if (response.status !== 200 && !errorExpected) {
		throw new Error('unexpected error');
	}

	if (response.status !== 200) {
		return {
			clientSecretKey: new Uint8Array(),
			sessionKey: new Uint8Array(),
			identityKey: ED25519PrivateKey.Generate(),
		};
	}

	const sessionKey = response.data.session;

	// expect(Uint8Array.from(expectedSessionKey)).toEqual(DecodeBase64(sessionKey));

	// res:= r.Result().(* handlers.AccountAuthFinalizeResponseBody)
	// res.EncryptedAccountKey.EncryptionVersion = 1
	// res.EncryptedAccountKey.EncryptionKind = auth.EncryptionKind
	// res.EncryptedAccountKey.EncryptionID = auth.EncryptionID
	// sessionKey = res.Session

	// TODO: this is not the production key create but will do for testing
	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.FromSeed(seed);
	const decrypter = PrivateKeyDecrypter.FromPrivateKey(encryptionKey);
	// TODO: this is not the production data type but will be suffient for testing

	const decryptedIdentityKey = await decrypter.Decrypt(
		DecodeBase64(response.data.encryptedAccountSeed.encryptedAccountSeed),
	);

	const identityKey = DecodePrivateKey(decryptedIdentityKey);

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		sessionKey: DecodeBase64(sessionKey),
		identityKey,
	};
}
