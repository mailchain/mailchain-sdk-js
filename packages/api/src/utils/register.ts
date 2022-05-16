import { OpaqueClient, RegistrationResponse, RegistrationClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { PrivateKey } from '@mailchain/crypto';
import { SignMailchainUsername } from '@mailchain/crypto/signatures/mailchain_username';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { PrivateKeyEncrypter } from '@mailchain/crypto/cipher/nacl/private-key-encrypter';
import { EncodePrivateKey, EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { DecodeBase64, EncodeBase64, EncodeHex } from '@mailchain/encoding';
import { AuthApiFactory, Configuration } from '../api';
import { OpaqueConfig } from '../types';

export async function Register(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	identityKey: PrivateKey,
	username: string,
	password: string,
): Promise<Uint8Array> {
	const opaqueRegisterClient: RegistrationClient = new OpaqueClient(opaqueConfig.parameters);
	const opaqueAuthClient: AuthClient = new OpaqueClient(opaqueConfig.parameters);
	const registerInitResponse = await AccountRegisterInit(
		apiConfig,
		opaqueConfig,
		opaqueRegisterClient,
		identityKey,
		username,
		password,
		200,
	);
	const registerCreateResponse = await AccountRegisterCreate(
		apiConfig,
		opaqueConfig,
		opaqueRegisterClient,
		opaqueAuthClient,
		username,
		password,
		registerInitResponse.registrationResponse,
		200,
	);

	return AccountRegisterFinalize(
		apiConfig,
		opaqueConfig,
		opaqueAuthClient,
		identityKey,
		username,
		registerCreateResponse.secretKey,
		registerCreateResponse.authStartResponse,
		registerCreateResponse.state,
		registerInitResponse.registrationSession,
		200,
	);
}

async function AccountRegisterInit(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueClient: RegistrationClient,
	identityKey: PrivateKey,
	username: string,
	password: string,
	expectedStatusCode: number,
): Promise<{
	registrationSession: Uint8Array;
	registrationResponse: RegistrationResponse;
}> {
	const request = await opaqueClient.registerInit(password);
	if (request instanceof Error) {
		throw new Error(`client failed to registerInit: ${request}`);
	}
	const serializedRequest = request.serialize();

	const signature = await SignMailchainUsername(identityKey, Buffer.from(username, 'utf-8'));

	const response = await AuthApiFactory(apiConfig).accountRegisterInit({
		identityKey: EncodeHex(EncodePublicKey(identityKey.PublicKey)),
		signature: EncodeBase64(signature),
		username,
		registerInitParams: EncodeBase64(Uint8Array.from(serializedRequest)),
	});
	// expect(response.status).toEqual(expectedStatusCode);

	return {
		registrationSession: DecodeBase64(response.data.registrationSession),
		registrationResponse: RegistrationResponse.deserialize(
			opaqueConfig.parameters,
			Array.from(DecodeBase64(response.data.registrationResponse)),
		),
	};
}

async function AccountRegisterCreate(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueRegisterClient: RegistrationClient,
	opaqueAuthClient: AuthClient,
	username: string,
	password: string,
	registrationResponse: RegistrationResponse,
	expectedStatusCode: number,
): Promise<{
	secretKey: Uint8Array;
	authStartResponse: Uint8Array;
	state: Uint8Array;
}> {
	const registerFinish = await opaqueRegisterClient.registerFinish(
		registrationResponse,
		opaqueConfig.serverIdentity,
		username,
	);
	if (registerFinish instanceof Error) {
		throw new Error(`client failed to registerFinish: ${registerFinish}`);
	}

	const keyExchange1 = await opaqueAuthClient.authInit(password);
	if (keyExchange1 instanceof Error) {
		throw new Error(`client failed to authInit: ${keyExchange1}`);
	}

	const response = await AuthApiFactory(apiConfig).accountRegisterCreate({
		authInitParams: EncodeBase64(Uint8Array.from(keyExchange1.serialize())),
		registerFinalizeParams: EncodeBase64(Uint8Array.from(registerFinish.record.serialize())),
		username,
	});
	// expect(response.status).toEqual(expectedStatusCode);

	return {
		secretKey: Uint8Array.from(registerFinish.export_key),
		authStartResponse: DecodeBase64(response.data.authStartResponse),
		state: DecodeBase64(response.data.state),
	};
}

async function AccountRegisterFinalize(
	apiConfig: Configuration,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
	identityKey: PrivateKey,
	username: string,
	registerClientSecretKey: Uint8Array,
	authStartResponse: Uint8Array,
	state: Uint8Array,
	registationSession: Uint8Array,
	expectedStatusCode: number,
): Promise<Uint8Array> {
	const keyExchange2 = KE2.deserialize(opaqueConfig.parameters, Array.from(authStartResponse));

	const authFinishResponse = await opaqueClient.authFinish(
		keyExchange2,
		opaqueConfig.serverIdentity,
		username,
		opaqueConfig.context,
	);
	if (authFinishResponse instanceof Error) {
		throw new Error(`client failed to authFinish: ${authFinishResponse}`);
	}

	const clientSessionKey = authFinishResponse.session_key;

	// TODO: this is not the production key generation but will be suffient for testing
	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.FromSeed(seed);
	const encrypter = PrivateKeyEncrypter.FromPrivateKey(encryptionKey);

	// TODO: this is not the production data type but will be suffient for testing
	const encryptedAccountKey = await encrypter.Encrypt(EncodePrivateKey(identityKey));

	const signedRegistrationSession = await identityKey.Sign(registationSession);

	const response = await AuthApiFactory(apiConfig).accountRegisterFinalize({
		username,
		authFinalizeParams: EncodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: EncodeBase64(state),
		encryptedAccountSeed: EncodeBase64(encryptedAccountKey),
		session: EncodeBase64(Uint8Array.from(clientSessionKey)),
		signedRegistrationSession: EncodeBase64(signedRegistrationSession),
	});
	// expect(response.status).toEqual(expectedStatusCode);

	if (response.status !== 200) {
		return new Uint8Array();
	}

	// expect(Uint8Array.from(clientSessionKey)).toEqual(DecodeBase64(response.data.session));
	// expect(registerClientSecretKey).toEqual(Uint8Array.from(authFinishResponse.export_key));

	return registerClientSecretKey;
}
