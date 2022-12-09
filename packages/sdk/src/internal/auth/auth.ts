import { OpaqueClient, KE2 } from '@cloudflare/opaque-ts';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import Axios from 'axios';
import { validate } from '@mailchain/crypto/mnemonic/mnemonic';
import {
	AuthApiFactory,
	AuthApiInterface,
	GetUsernameAvailableResponseBody,
	UsersApiFactory,
	UsersApiInterface,
} from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { Configuration } from '../../mailchain';
import { OpaqueConfig } from './opaque';
import { accountAuthFinalize, accountAuthInit, LoginError } from './login';
import { accountRegisterCreate, accountRegisterFinalize, accountRegisterInit } from './register';
import { AuthenticatedResponse } from './response';
import { passwordResetCreate, passwordResetFinalize, passwordResetInit, ResetError } from './reset';

type LoginParams = {
	username: string;
	password: string;
	captcha: string;
	createSession?: boolean;
};

type RegisterParams = {
	username: string;
	password: string;
	captcha: string;
	mnemonicPhrase: string;
	reservedNameSignature?: string;
};

type ResetParams = {
	username: string;
	password: string;
	captcha: string;
	mnemonicPhrase: string;
};

type UsernameAvailabilityCause = {
	type: 'username-availability';
	reason: 'reserved' | 'invalid' | 'taken' | 'unavailable';
};

type SeedPhraseCause = { type: 'seed-phrase'; reason: 'already-used' };
type RegisterErrorCause = UsernameAvailabilityCause | SeedPhraseCause;

export class RegisterError extends Error {
	constructor(public readonly regCause: RegisterErrorCause) {
		super(`[${regCause.type}]-[${regCause.reason}]`);
	}
}

export class Authentication {
	constructor(
		private readonly usersApi: UsersApiInterface,
		private readonly authApi: AuthApiInterface,
		private readonly opaqueConfig: OpaqueConfig,
	) {}

	static create(sdkConfig: Configuration, opaqueConfig: OpaqueConfig) {
		const axiosConfig = createAxiosConfiguration(sdkConfig);
		const authApi = AuthApiFactory(axiosConfig);
		const usersApi = UsersApiFactory(axiosConfig);

		return new Authentication(usersApi, authApi, opaqueConfig);
	}

	async login(params: LoginParams) {
		const opaqueClient = new OpaqueClient(this.opaqueConfig.parameters);
		params.username = params.username.trim().toLowerCase();

		try {
			const authInitResponse = await accountAuthInit(
				params.username,
				params.password,
				params.captcha,
				this.authApi,
				opaqueClient,
			);

			const keyExchange2 = KE2.deserialize(
				this.opaqueConfig.parameters,
				Array.from(authInitResponse.keyExchange2),
			);

			return accountAuthFinalize(
				params.username,
				keyExchange2,
				authInitResponse.state,
				params.createSession ?? false,
				this.authApi,
				this.opaqueConfig,
				opaqueClient,
			);
		} catch (e) {
			if (Axios.isAxiosError(e)) {
				throw new LoginError('network-error', 'axios network error');
			}
			throw e;
		}
	}

	async checkUsernameAvailability(username: string): Promise<GetUsernameAvailableResponseBody> {
		const { data: availability } = await this.usersApi.getUsernameAvailable(username);
		return { ...availability };
	}

	/** @throws {@link RegisterError} */
	async register(params: RegisterParams): Promise<AuthenticatedResponse> {
		params.username = params.username.trim().toLowerCase();

		const opaqueRegisterClient = new OpaqueClient(this.opaqueConfig.parameters);
		const opaqueLoginClient = new OpaqueClient(this.opaqueConfig.parameters);

		if (!validate(params.mnemonicPhrase)) {
			throw new Error('invalid mnemonic phrase');
		}

		const rootAccountKey = ED25519PrivateKey.fromMnemonicPhrase(params.mnemonicPhrase);
		const keyRing = KeyRing.fromPrivateKey(rootAccountKey);
		const identityKey = keyRing.accountIdentityKey();
		const messagingPublicKey = keyRing.accountMessagingKey().publicKey;
		const registerInitResponse = await accountRegisterInit(
			params.username,
			params.password,
			params.captcha,
			params.reservedNameSignature,
			identityKey,
			this.authApi,
			this.opaqueConfig,
			opaqueRegisterClient,
		).catch((e) => {
			if (Axios.isAxiosError(e)) {
				switch (e.response?.data.message) {
					case 'username is taken':
					case 'username already exists':
						throw new RegisterError({ type: 'username-availability', reason: 'taken' });
					case 'username is invalid':
						throw new RegisterError({ type: 'username-availability', reason: 'invalid' });
					case 'username is reserved':
						throw new RegisterError({ type: 'username-availability', reason: 'reserved' });
					case 'username is unavailable':
						throw new RegisterError({ type: 'username-availability', reason: 'unavailable' });
					case 'seed phrase already in use': {
						throw new RegisterError({ type: 'seed-phrase', reason: 'already-used' });
					}
				}
			}
			throw e;
		});
		const registerCreateResponse = await accountRegisterCreate(
			params.username,
			params.password,
			registerInitResponse.registrationResponse,
			this.authApi,
			this.opaqueConfig,
			opaqueRegisterClient,
			opaqueLoginClient,
		);

		const finalizeResponse = await accountRegisterFinalize(
			params.mnemonicPhrase,
			identityKey,
			messagingPublicKey,
			params.username,
			registerCreateResponse.authStartResponse,
			registerCreateResponse.state,
			registerInitResponse.registrationSession,
			this.authApi,
			this.opaqueConfig,
			opaqueLoginClient,
		);

		return {
			...finalizeResponse,
			rootAccountKey,
		};
	}

	async resetPassword(params: ResetParams): Promise<AuthenticatedResponse> {
		params.username = params.username.trim().toLowerCase();

		const opaqueRegisterClient = new OpaqueClient(this.opaqueConfig.parameters);
		const opaqueLoginClient = new OpaqueClient(this.opaqueConfig.parameters);

		if (!validate(params.mnemonicPhrase)) {
			throw new Error('invalid mnemonic phrase');
		}

		const rootAccountKey = ED25519PrivateKey.fromMnemonicPhrase(params.mnemonicPhrase);
		const keyRing = KeyRing.fromPrivateKey(rootAccountKey);
		const identityKey = keyRing.accountIdentityKey();
		const registerInitResponse = await passwordResetInit(
			params.username,
			params.password,
			params.captcha,
			identityKey,
			this.authApi,
			this.opaqueConfig,
			opaqueRegisterClient,
		).catch((e) => {
			if (Axios.isAxiosError(e)) {
				switch (e.response?.data.message) {
					case 'identity key does not match username':
						throw new ResetError({
							type: 'identity-key-miss-match',
							reason: 'incorrect-identity-key-for-username',
						});
				}
			}
			throw e;
		});
		const registerCreateResponse = await passwordResetCreate(
			params.username,
			params.password,
			registerInitResponse.registrationResponse,
			this.authApi,
			this.opaqueConfig,
			opaqueRegisterClient,
			opaqueLoginClient,
		);

		const finalizeResponse = await passwordResetFinalize(
			params.mnemonicPhrase,
			identityKey,
			params.username,
			registerCreateResponse.authStartResponse,
			registerCreateResponse.state,
			registerInitResponse.registrationSession,
			this.authApi,
			this.opaqueConfig,
			opaqueLoginClient,
		);

		return {
			...finalizeResponse,
			rootAccountKey,
		};
	}
}
