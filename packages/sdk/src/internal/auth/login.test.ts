import { mock, MockProxy } from 'jest-mock-extended';
import { OpaqueClient, KE1, KE2, KE3 } from '@cloudflare/opaque-ts';
import { AxiosResponse } from 'axios';
import { decodeBase64, encodeBase64, encodeHexZeroX } from '@mailchain/encoding';
import { PrivateKeyEncrypter, secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { AuthApiInterface } from '../api';
import { OpaqueConfig } from './opaque';
import { accountAuthFinalize, accountAuthInit } from './login';

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
				data: { state: encodeBase64(secureRandom(32)), authStartResponse: encodeBase64(secureRandom(32)) },
			} as AxiosResponse;
			mockAuthApi.accountAuthInit.mockResolvedValue(mockAuthInitResponse);

			const res = await accountAuthInit('username', 'password', 'captcha', mockAuthApi, mockOpaqueClient);

			expect(encodeBase64(res.state)).toEqual(mockAuthInitResponse.data.state);
			expect(encodeBase64(res.keyExchange2)).toEqual(mockAuthInitResponse.data.authStartResponse);
			expect(mockOpaqueClient.authInit).toBeCalledWith('password');
			expect(mockAuthApi.accountAuthInit).toBeCalledWith({
				username: 'username',
				params: encodeBase64(Uint8Array.from(ke1Serialized)),
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
			const localStorageSessionKey = secureRandom();
			const mockAuthFinalizeResponse = {
				status: 200,
				data: {
					localStorageSessionKey: encodeBase64(localStorageSessionKey),
					encryptedAccountSeed: {
						encryptedAccountSeed: encodeBase64(encryptedAccountKeySeed),
					},
				},
			};
			mockAuthApi.accountAuthFinalize.mockResolvedValue(mockAuthFinalizeResponse as AxiosResponse);

			const res = await accountAuthFinalize(
				'username',
				mockKe2,
				mockAuthState,
				mockAuthApi,
				mockOpaqueConfig,
				mockOpaqueClient,
			);

			expect(res.clientSecretKey).toEqual(mockExportKey);
			expect(res.localStorageSessionKey).toEqual(localStorageSessionKey);
			expect(res.rootAccountKey).toEqual(ED25519PrivateKey.fromSeed(accountKeySeed));
			expect(mockOpaqueClient.authFinish).toBeCalledWith(
				mockKe2,
				mockOpaqueConfig.serverIdentity,
				'username',
				mockOpaqueConfig.context,
			);
			expect(mockAuthApi.accountAuthFinalize).toBeCalledWith(
				{
					params: encodeBase64(ke3Serialized),
					authState: encodeBase64(mockAuthState),
				},
				{ withCredentials: true },
			);
		});
	});
});
