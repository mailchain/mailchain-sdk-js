import { RegistrationResponse, RegistrationClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { PrivateKey, PublicKey, Signer, SignerWithPublicKey } from '@mailchain/crypto';
import { signMailchainUsername } from '@mailchain/crypto/signatures/mailchain_username';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { PrivateKeyEncrypter } from '@mailchain/crypto/cipher/nacl/private-key-encrypter';
import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { decodeBase64, encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import { getMailchainUsernameParams, createProofMessage } from '@mailchain/keyreg';
import { signRawEd25519 } from '@mailchain/crypto/signatures/raw_ed25119';
import { decodeUtf8 } from '@mailchain/encoding/utf8';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from './opaque';
import { AuthenticatedResponse } from './response';

export async function accountRegisterInit(
	username: string,
	password: string,
	captchaResponse: string,
	identityKey: SignerWithPublicKey,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueClient: RegistrationClient,
): Promise<{
	registrationSession: Uint8Array;
	registrationResponse: RegistrationResponse;
}> {
	username = username.trim().toLowerCase();

	const request = await opaqueClient.registerInit(password);
	if (request instanceof Error) {
		throw new Error(`failed to initialize registration: ${request}`);
	}
	const serializedRequest = request.serialize();

	const signature = await signMailchainUsername(identityKey, Buffer.from(username, 'utf-8'));

	const response = await authApi.accountRegisterInit({
		identityKey: encodeHexZeroX(encodePublicKey(identityKey.publicKey)),
		signature: encodeBase64(signature),
		username,
		registerInitParams: encodeBase64(Uint8Array.from(serializedRequest)),
		captchaResponse,
	});

	if (response.status !== 200) {
		throw new Error(`failed to initialize registration: ${response.status}`);
	}

	return {
		registrationSession: decodeBase64(response.data.registrationSession),
		registrationResponse: RegistrationResponse.deserialize(
			opaqueConfig.parameters,
			Array.from(decodeBase64(response.data.registrationResponse)),
		),
	};
}

export async function accountRegisterCreate(
	username: string,
	password: string,
	registrationResponse: RegistrationResponse,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueRegisterClient: RegistrationClient,
	opaqueAuthClient: AuthClient,
): Promise<{
	secretKey: Uint8Array;
	authStartResponse: Uint8Array;
	state: Uint8Array;
}> {
	username = username.trim().toLowerCase();
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

	const response = await authApi.accountRegisterCreate({
		authInitParams: encodeBase64(Uint8Array.from(keyExchange1.serialize())),
		registerFinalizeParams: encodeBase64(Uint8Array.from(registerFinish.record.serialize())),
		username,
	});

	if (response.status !== 200) {
		throw new Error(`failed to create account: ${response.status}`);
	}

	return {
		secretKey: Uint8Array.from(registerFinish.export_key),
		authStartResponse: decodeBase64(response.data.authStartResponse),
		state: decodeBase64(response.data.state),
	};
}

export async function accountRegisterFinalize(
	identityKeySeed: Uint8Array,
	identityKey: Signer,
	messagingPublicKey: PublicKey,
	username: string,
	authStartResponse: Uint8Array,
	state: Uint8Array,
	registrationSession: Uint8Array,
	rootAccountKey: PrivateKey,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
): Promise<AuthenticatedResponse> {
	username = username.trim().toLowerCase();
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

	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(encryptionKey);

	const usernameParams = getMailchainUsernameParams();
	const usernameProofMessage = createProofMessage(
		usernameParams,
		decodeUtf8(username),
		messagingPublicKey,
		1 /** TODO: Nonce */,
	);
	const signedUsernameProof = await signRawEd25519(identityKey, decodeUtf8(usernameProofMessage));

	const encryptedAccountSeed = await encrypter.encrypt(identityKeySeed);

	const signedRegistrationSession = await identityKey.sign(registrationSession);

	const response = await authApi.accountRegisterFinalize({
		username,
		authFinalizeParams: encodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: encodeBase64(state),
		encryptedAccountSeed: encodeBase64(encryptedAccountSeed),
		session: encodeBase64(Uint8Array.from(clientSessionKey)),
		signedRegistrationSession: encodeBase64(signedRegistrationSession),
		messagingKey: {
			key: encodeHexZeroX(encodePublicKey(messagingPublicKey)),
			signature: encodeHexZeroX(signedUsernameProof),
		},
	});

	if (response.status !== 200) {
		throw new Error(`failed to finalize registration status: ${response.status}`);
	}

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		sessionKey: decodeBase64(response.data.session),
		rootAccountKey,
	};
}
