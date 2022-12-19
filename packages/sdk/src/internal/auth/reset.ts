import { AuthClient, KE2, RegistrationClient, RegistrationResponse } from '@cloudflare/opaque-ts';
import { Signer, SignerWithPublicKey, encodePublicKey } from '@mailchain/crypto';
import { decodeBase64, encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import { AuthApiInterface } from '../api';
import { signMailchainPasswordReset, verifyMailchainPasswordReset } from '../signatures/mailchain_password_reset';
import { OpaqueConfig } from './opaque';
import { AuthenticatedResponse } from './response';
import { encryptAccountSecret } from './accountSecretCrypto';

type ResetErrorCause = { type: 'identity-key-miss-match'; reason: 'incorrect-identity-key-for-username' };

export class ResetError extends Error {
	constructor(public readonly regCause: ResetErrorCause) {
		super(`[${regCause.type}]-[${regCause.reason}]`);
	}
}

export async function passwordResetInit(
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

	const expires = Math.floor(Date.now() / 1000 + 60 * 5); // add 5 mins
	const signature = await signMailchainPasswordReset(
		identityKey,
		Buffer.from(username, 'utf-8'),
		new Date(expires * 1000),
	);

	const response = await authApi.passwordResetInit({
		identityKey: encodeHexZeroX(encodePublicKey(identityKey.publicKey)),
		signature: encodeBase64(signature),
		username,
		registerInitParams: encodeBase64(Uint8Array.from(serializedRequest)),
		captchaResponse,
		expires,
	});

	if (response.status !== 200) {
		throw new Error(`failed to initialize registration: ${response.status}`);
	}

	return {
		registrationSession: decodeBase64(response.data.resetSession),
		registrationResponse: RegistrationResponse.deserialize(
			opaqueConfig.parameters,
			Array.from(decodeBase64(response.data.registrationResponse)),
		),
	};
}

export async function passwordResetCreate(
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

	const response = await authApi.passwordResetCreate({
		authInitParams: encodeBase64(Uint8Array.from(keyExchange1.serialize())),
		registerFinalizeParams: encodeBase64(Uint8Array.from(registerFinish.record.serialize())),
		username,
	});

	if (response.status !== 200) {
		throw new Error(`failed to create password reset: ${response.status}`);
	}

	return {
		secretKey: Uint8Array.from(registerFinish.export_key),
		authStartResponse: decodeBase64(response.data.authStartResponse),
		state: decodeBase64(response.data.state),
	};
}

export async function passwordResetFinalize(
	accountSecret: AuthenticatedResponse['accountSecret'],
	identityKey: Signer,
	username: string,
	authStartResponse: Uint8Array,
	state: Uint8Array,
	resetSession: Uint8Array,
	authApi: AuthApiInterface,
	opaqueConfig: OpaqueConfig,
	opaqueClient: AuthClient,
) {
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
	const { encryptedAccountSecret } = await encryptAccountSecret(
		Uint8Array.from(authFinishResponse.export_key),
		accountSecret,
	);
	const signedResetSession = await identityKey.sign(resetSession);

	const response = await authApi.passwordResetFinalize({
		username,
		authFinalizeParams: encodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
		authState: encodeBase64(state),
		encryptedMnemonicEntropy: encryptedAccountSecret,
		session: encodeBase64(Uint8Array.from(clientSessionKey)),
		signedResetSession: encodeBase64(signedResetSession),
	});

	if (response.status !== 200) {
		throw new Error(`failed to finalize registration status: ${response.status}`);
	}

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
		accountSecret,
	};
}
