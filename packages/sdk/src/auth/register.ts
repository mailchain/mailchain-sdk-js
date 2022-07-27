import { RegistrationResponse, RegistrationClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import { PrivateKey, PublicKey, Signer, SignerWithPublicKey } from '@mailchain/crypto';
import { SignMailchainUsername } from '@mailchain/crypto/signatures/mailchain_username';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { PrivateKeyEncrypter } from '@mailchain/crypto/cipher/nacl/private-key-encrypter';
import { EncodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { DecodeBase64, EncodeBase64, EncodeHexZeroX } from '@mailchain/encoding';
import { getMailchainUsernameParams, CreateProofMessage } from '@mailchain/keyreg';
import { signRawEd25519 } from '@mailchain/crypto/signatures/raw_ed25119';
import { DecodeUtf8 } from '@mailchain/encoding/utf8';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from '../types';
import { AuthenticatedResponse } from './response';

export async function AccountRegisterInit(
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
	const request = await opaqueClient.registerInit(password);
	if (request instanceof Error) {
		throw new Error(`failed to initialize registration: ${request}`);
	}
	const serializedRequest = request.serialize();

	const signature = await SignMailchainUsername(identityKey, Buffer.from(username, 'utf-8'));

	const response = await authApi.accountRegisterInit({
		identityKey: EncodeHexZeroX(EncodePublicKey(identityKey.publicKey)),
		signature: EncodeBase64(signature),
		username,
		registerInitParams: EncodeBase64(Uint8Array.from(serializedRequest)),
		captchaResponse,
	});

	if (response.status !== 200) {
		throw new Error(`failed to initialize registration: ${response.status}`);
	}

	return {
		registrationSession: DecodeBase64(response.data.registrationSession),
		registrationResponse: RegistrationResponse.deserialize(
			opaqueConfig.parameters,
			Array.from(DecodeBase64(response.data.registrationResponse)),
		),
	};
}

export async function AccountRegisterCreate(
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
		authInitParams: EncodeBase64(Uint8Array.from(keyExchange1.serialize())),
		registerFinalizeParams: EncodeBase64(Uint8Array.from(registerFinish.record.serialize())),
		username,
	});

	if (response.status !== 200) {
		throw new Error(`failed to create account: ${response.status}`);
	}

	return {
		secretKey: Uint8Array.from(registerFinish.export_key),
		authStartResponse: DecodeBase64(response.data.authStartResponse),
		state: DecodeBase64(response.data.state),
	};
}

export async function AccountRegisterFinalize(
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
	const usernameProofMessage = CreateProofMessage(
		usernameParams,
		DecodeUtf8(username),
		messagingPublicKey,
		1 /** TODO: Nonce */,
	);
	const signedUsernameProof = await signRawEd25519(identityKey, DecodeUtf8(usernameProofMessage));

	const encryptedAccountSeed = await encrypter.encrypt(identityKeySeed);

	const signedRegistrationSession = await identityKey.sign(registrationSession);

	const response = await authApi.accountRegisterFinalize({
		username,
		authFinalizeParams: EncodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: EncodeBase64(state),
		encryptedAccountSeed: EncodeBase64(encryptedAccountSeed),
		session: EncodeBase64(Uint8Array.from(clientSessionKey)),
		signedRegistrationSession: EncodeBase64(signedRegistrationSession),
		messagingKey: {
			key: EncodeHexZeroX(EncodePublicKey(messagingPublicKey)),
			signature: EncodeHexZeroX(signedUsernameProof),
		},
	});

	if (response.status !== 200) {
		throw new Error(`failed to finalize registration status: ${response.status}`);
	}

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		sessionKey: DecodeBase64(response.data.session),
		rootAccountKey,
	};
}
