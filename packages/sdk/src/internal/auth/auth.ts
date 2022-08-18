import { OpaqueClient, KE2 } from '@cloudflare/opaque-ts';
import { ED25519PrivateKey } from '@mailchain/crypto';
import { KeyRing } from '@mailchain/keyring';
import Axios from 'axios';
import { AuthApiFactory, AuthApiInterface } from '../api';
import { createAxiosConfiguration } from '../axios/config';
import { Configuration } from '../../mailchain';
import { OpaqueConfig } from './opaque';
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
	reservedNameSignature?: string;
};

export class Authentication {
	constructor(private readonly authApi: AuthApiInterface, private readonly opaqueConfig: OpaqueConfig) {}

	static create(sdkConfig: Configuration, opaqueConfig: OpaqueConfig) {
		const authApi = AuthApiFactory(createAxiosConfiguration(sdkConfig));

		return new Authentication(authApi, opaqueConfig);
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

	async register(params: RegisterParams) {
		params.username = params.username.trim().toLowerCase();

		const opaqueRegisterClient = new OpaqueClient(this.opaqueConfig.parameters);
		const opaqueLoginClient = new OpaqueClient(this.opaqueConfig.parameters);

		const rootAccountKey = ED25519PrivateKey.fromSeed(params.identityKeySeed);
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
		);
		const registerCreateResponse = await accountRegisterCreate(
			params.username,
			params.password,
			registerInitResponse.registrationResponse,
			this.authApi,
			this.opaqueConfig,
			opaqueRegisterClient,
			opaqueLoginClient,
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
			opaqueLoginClient,
		);
	}
}
