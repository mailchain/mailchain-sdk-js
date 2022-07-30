import { OpaqueClient, KE2 } from '@cloudflare/opaque-ts';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { KeyRing } from '@mailchain/keyring';
import Axios from 'axios';
import { AuthApiFactory, AuthApiInterface, Configuration } from '../api';
import { OpaqueConfig } from '../types';
import { accountAuthFinalize, accountAuthInit, LoginError } from './login';
import { accountRegisterCreate, accountRegisterFinalize, accountRegisterInit } from './register';

type LoginParams = {
	username: string;
	password: string;
	captcha: string;
};

type RegisterParams = {
	username: string;
	password: string;
	captcha: string;
	identityKeySeed: Uint8Array;
};

export class Authentication {
	constructor(
		private readonly authApi: AuthApiInterface,
		private readonly opaqueClient: OpaqueClient,
		private readonly opaqueConfig: OpaqueConfig,
	) {}

	static create(apiConfig: Configuration, opaqueConfig: OpaqueConfig) {
		const authApi = AuthApiFactory(apiConfig);
		const opaqueClient = new OpaqueClient(opaqueConfig.parameters);

		return new Authentication(authApi, opaqueClient, opaqueConfig);
	}

	async login(params: LoginParams) {
		try {
			const authInitResponse = await accountAuthInit(
				params.username,
				params.password,
				params.captcha,
				this.authApi,
				this.opaqueClient,
			);

			const keyExchange2 = KE2.deserialize(
				this.opaqueConfig.parameters,
				Array.from(authInitResponse.keyExchange2),
			);

			return accountAuthFinalize(
				params.username,
				keyExchange2,
				authInitResponse.state,
				this.authApi,
				this.opaqueConfig,
				this.opaqueClient,
			);
		} catch (e) {
			if (Axios.isAxiosError(e)) {
				throw new LoginError('network-error', 'axios network error');
			}
			throw e;
		}
	}

	async register(params: RegisterParams) {
		const rootAccountKey = ED25519PrivateKey.fromSeed(params.identityKeySeed);
		const keyRing = KeyRing.fromPrivateKey(rootAccountKey);
		const identityKey = keyRing.accountIdentityKey();
		const messagingPublicKey = keyRing.accountMessagingKey().publicKey;
		const registerInitResponse = await accountRegisterInit(
			params.username.toLowerCase(),
			params.password,
			params.captcha,
			identityKey,
			this.authApi,
			this.opaqueConfig,
			this.opaqueClient,
		);
		const registerCreateResponse = await accountRegisterCreate(
			params.username.toLowerCase(),
			params.password,
			registerInitResponse.registrationResponse,
			this.authApi,
			this.opaqueConfig,
			this.opaqueClient,
			this.opaqueClient,
		);

		return accountRegisterFinalize(
			params.identityKeySeed,
			identityKey,
			messagingPublicKey,
			params.username,
			registerCreateResponse.authStartResponse,
			registerCreateResponse.state,
			registerInitResponse.registrationSession,
			rootAccountKey,
			this.authApi,
			this.opaqueConfig,
			this.opaqueClient,
		);
	}
}
