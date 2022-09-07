import { RegistrationResponse, RegistrationClient, AuthClient, KE2 } from '@cloudflare/opaque-ts';
import {
	PublicKey,
	Signer,
	SignerWithPublicKey,
	ED25519PrivateKey,
	encodePublicKey,
	PrivateKeyEncrypter,
} from '@mailchain/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { decodeBase64, encodeBase64, encodeHexZeroX, decodeUtf8 } from '@mailchain/encoding';
import { toEntropy } from '@mailchain/crypto/mnemonic/mnemonic';
import { signMailchainUsername } from '../signatures/mailchain_username';
import { getMailchainUsernameParams, createProofMessage } from '../keyreg';
import { signRawEd25519 } from '../signatures/raw_ed25119';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from './opaque';

export async function accountRegisterInit(
	username: string,
	password: string,
	captchaResponse: string,
	reservedNameSignature: string | undefined,
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
		reservedNameSignature,
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
	mnemonicPhrase: string,
	identityKey: Signer,
	messagingPublicKey: PublicKey,
	username: string,
	authStartResponse: Uint8Array,
	state: Uint8Array,
	registrationSession: Uint8Array,
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

	const seed = sha256(Uint8Array.from(authFinishResponse.export_key));
	const encryptionKey = ED25519PrivateKey.fromSeed(seed);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(encryptionKey);

	// sign username with identity as proof they are linked
	const signedUsernameProof = await createUsernameProof(username, messagingPublicKey, identityKey);
	// encrypt entropy so mnemonic phrase can be recovered later
	const encryptedMnemonicEntropy = await encrypter.encrypt(toEntropy(mnemonicPhrase));
	const signedRegistrationSession = await identityKey.sign(registrationSession);

	const response = await authApi.accountRegisterFinalize(
		{
			username,
			authFinalizeParams: encodeBase64(Uint8Array.from(authFinishResponse.ke3.serialize())),
			authState: encodeBase64(state),
			encryptedMnemonicEntropy: encodeBase64(encryptedMnemonicEntropy),
			session: encodeBase64(Uint8Array.from(clientSessionKey)),
			signedRegistrationSession: encodeBase64(signedRegistrationSession),
			messagingKey: {
				key: encodeHexZeroX(encodePublicKey(messagingPublicKey)),
				signature: encodeHexZeroX(signedUsernameProof),
			},
		},
		{ withCredentials: true },
	);

	if (response.status !== 200) {
		throw new Error(`failed to finalize registration status: ${response.status}`);
	}

	return {
		clientSecretKey: new Uint8Array(authFinishResponse.export_key),
	};
}

async function createUsernameProof(username: string, messagingPublicKey: PublicKey, identityKey: Signer) {
	const usernameParams = getMailchainUsernameParams();
	const usernameProofMessage = createProofMessage(
		usernameParams,
		decodeUtf8(username),
		messagingPublicKey,
		1 /** TODO: Nonce */,
	);
	return await signRawEd25519(identityKey, decodeUtf8(usernameProofMessage));
}
