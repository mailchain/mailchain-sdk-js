import { OpaqueClient } from '@cloudflare/opaque-ts';
import { mock, MockProxy } from 'jest-mock-extended';
import { encodeBase64 } from '@mailchain/encoding';
import { PrivateKeyEncrypter, secureRandom } from '@mailchain/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { AccountAuthFinalizeResponseBody, AccountAuthInitResponseBody, AuthApiInterface } from '../api';
import { OpaqueConfig } from './opaque';
import { Authentication } from './auth';

const mockedOpaqueClientConstructor = jest.fn();

const mockKe2Deserialize = jest.fn();
const mockAuthApiFactory = jest.fn();
jest.mock('@cloudflare/opaque-ts', () => ({
	OpaqueClient: jest.fn().mockImplementation((...params) => mockedOpaqueClientConstructor(...params)),
	KE2: {
		deserialize: (...params) => mockKe2Deserialize(...params),
	},
}));
jest.mock('../api', () => ({
	AuthApiFactory: (...params) => mockAuthApiFactory(...params),
}));

const clientSecretKeyBytes = secureRandom(32);
const clientSeedEncryptKeyBytes = sha256(clientSecretKeyBytes);
const clientSeedEncryptKey = ED25519PrivateKey.fromSeed(clientSeedEncryptKeyBytes);
const testOpaqueConfig: OpaqueConfig = {
	parameters: {} as any,
	serverIdentity: 'serverIdentity',
	context: 'context',
};

describe('login', () => {
	let mailchainAuth: Authentication;
	let mockAuthApi: MockProxy<AuthApiInterface>;
	let mockOpaqueClient: MockProxy<OpaqueClient>;
	beforeEach(() => {
		mockAuthApi = mock();
		mockAuthApiFactory.mockReturnValue(mockAuthApi);

		mockOpaqueClient = mock();
		mockedOpaqueClientConstructor.mockReturnValue(mockOpaqueClient);
		mockKe2Deserialize.mockClear();

		mailchainAuth = new Authentication(mockAuthApi, mockOpaqueClient, testOpaqueConfig);
	});
	it('should successfully perform auth init and finalize', async () => {
		// Note: Most of this test is redundant since the individual login steps have been tested as part of 'login.test.ts'
		// It should be shortened with mocking of those individual steps.
		// --- Given
		// authInit
		const ke1Serialize = secureRandom(32);
		const testAuthState = encodeBase64(Buffer.from('state'));
		const apiAuthInitResponse: AccountAuthInitResponseBody = {
			state: testAuthState,
			authStartResponse: encodeBase64(Buffer.from('authStartResponse')),
		};
		mockOpaqueClient.authInit.mockResolvedValue({ serialize: () => ke1Serialize } as any);
		mockAuthApi.accountAuthInit.mockResolvedValue({
			status: 200,
			data: apiAuthInitResponse,
		} as any);
		mockKe2Deserialize.mockReturnValue('mockedKE2');
		// authFinalize
		const ke3Serialize = secureRandom(32);
		const accountSeed = secureRandom(32);
		const sessionKey = secureRandom(32);
		const accountAuthFinalizeResponse: AccountAuthFinalizeResponseBody = {
			encryptedAccountSeed: {
				encryptedAccountSeed: encodeBase64(
					await PrivateKeyEncrypter.fromPrivateKey(clientSeedEncryptKey).encrypt(accountSeed),
				),
			},
			session: encodeBase64(sessionKey),
		} as any;
		mockOpaqueClient.authFinish.mockResolvedValue({
			ke3: { serialize: () => ke3Serialize },
			export_key: clientSecretKeyBytes,
		} as any);
		mockAuthApi.accountAuthFinalize.mockResolvedValue({ status: 200, data: accountAuthFinalizeResponse } as any);

		// --- When
		const authRes = await mailchainAuth.login({
			username: 'username',
			password: 'password',
			captcha: 'captchaResponse',
		});

		// --- Then
		// assert authInit
		expect(mockOpaqueClient.authInit.mock.calls[0]).toEqual(['password']);
		expect(mockAuthApi.accountAuthInit.mock.calls[0][0]).toEqual({
			username: 'username',
			params: encodeBase64(ke1Serialize),
			captchaResponse: 'captchaResponse',
		});

		// assert authFinalize
		expect(mockOpaqueClient.authFinish.mock.calls[0]).toEqual([
			'mockedKE2',
			testOpaqueConfig.serverIdentity,
			'username',
			testOpaqueConfig.context,
		]);
		expect(mockAuthApi.accountAuthFinalize.mock.calls[0][0]).toEqual({
			params: encodeBase64(ke3Serialize),
			authState: testAuthState,
		});
		// assert final result
		expect(authRes.clientSecretKey).toEqual(clientSecretKeyBytes);
		expect(authRes.sessionKey).toEqual(sessionKey);
		expect(authRes.rootAccountKey).toEqual(ED25519PrivateKey.fromSeed(accountSeed));
	});
});
