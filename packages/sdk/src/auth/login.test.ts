import { mock, MockProxy } from 'jest-mock-extended';
import { OpaqueClient, KE1, KE2, KE3 } from '@cloudflare/opaque-ts';
import { AxiosResponse } from 'axios';
import { DecodeBase64, EncodeBase64 } from '@mailchain/encoding';
import { PrivateKeyEncrypter, secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from '../types';
import { AccountAuthFinalize, AccountAuthInit } from './login';

describe('isolated login tests', () => {
	let mockAuthApi: MockProxy<AuthApiInterface>;
	let mockOpaqueClient: MockProxy<OpaqueClient>;

	beforeEach(() => {
		mockAuthApi = mock();
		mockOpaqueClient = mock();
	});

	describe('AccountAuthInit', () => {
		it('successfully initializes auth', async () => {
			const ke1Serialized = secureRandom();
			const mockKe1 = { serialize: () => [...ke1Serialized] } as KE1;
			mockOpaqueClient.authInit.mockResolvedValue(mockKe1);
			const mockAuthInitResponse = {
				status: 200,
				data: { state: EncodeBase64(secureRandom(32)), authStartResponse: EncodeBase64(secureRandom(32)) },
			} as AxiosResponse;
			mockAuthApi.accountAuthInit.mockResolvedValue(mockAuthInitResponse);

			const res = await AccountAuthInit('username', 'password', 'captcha', mockAuthApi, mockOpaqueClient);

			expect(EncodeBase64(res.state)).toEqual(mockAuthInitResponse.data.state);
			expect(EncodeBase64(res.keyExchange2)).toEqual(mockAuthInitResponse.data.authStartResponse);
			expect(mockOpaqueClient.authInit).toBeCalledWith('password');
			expect(mockAuthApi.accountAuthInit).toBeCalledWith({
				username: 'username',
				params: EncodeBase64(Uint8Array.from(ke1Serialized)),
				captchaResponse: 'captcha',
			});
		});
	});

	describe('AccountAuthFinalize', () => {
		const mockOpaqueConfig = { serverIdentity: 'serverIdentity', context: 'context' } as OpaqueConfig;

		const mockExportKey = secureRandom(32);
		const accountKeySeed = secureRandom(32);

		const mockKe2 = {} as KE2;
		const ke3Serialized = secureRandom();
		const mockKe3 = { serialize: () => [...ke3Serialized] } as KE3;

		it('successfully finalizes auth', async () => {
			const mockAuthState = secureRandom();
			const mockAuthFinish = {
				ke3: mockKe3,
				export_key: [...mockExportKey],
				session_key: [...secureRandom()],
			};
			mockOpaqueClient.authFinish.mockResolvedValue(mockAuthFinish);
			const encryptedAccountKeySeed = await PrivateKeyEncrypter.fromPrivateKey(
				ED25519PrivateKey.fromSeed(sha256(mockExportKey)),
			).encrypt(accountKeySeed);
			const mockAuthFinalizeResponse = {
				status: 200,
				data: {
					session: EncodeBase64(secureRandom()),
					encryptedAccountSeed: {
						encryptedAccountSeed: EncodeBase64(encryptedAccountKeySeed),
					},
				},
			};
			mockAuthApi.accountAuthFinalize.mockResolvedValue(mockAuthFinalizeResponse as AxiosResponse);

			const res = await AccountAuthFinalize(
				'username',
				mockKe2,
				mockAuthState,
				mockAuthApi,
				mockOpaqueConfig,
				mockOpaqueClient,
			);

			expect(res.clientSecretKey).toEqual(mockExportKey);
			expect(res.sessionKey).toEqual(DecodeBase64(mockAuthFinalizeResponse.data.session));
			expect(res.rootAccountKey).toEqual(ED25519PrivateKey.fromSeed(accountKeySeed));
			expect(mockOpaqueClient.authFinish).toBeCalledWith(
				mockKe2,
				mockOpaqueConfig.serverIdentity,
				'username',
				mockOpaqueConfig.context,
			);
			expect(mockAuthApi.accountAuthFinalize).toBeCalledWith({
				params: EncodeBase64(ke3Serialized),
				authState: EncodeBase64(mockAuthState),
			});
		});
	});
});
