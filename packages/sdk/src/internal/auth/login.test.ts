import { mock, MockProxy } from 'jest-mock-extended';
import { OpaqueClient, KE1, KE2, KE3 } from '@cloudflare/opaque-ts';
import { AxiosResponse } from 'axios';
import { encodeBase64 } from '@mailchain/encoding';
import { PrivateKeyEncrypter, secureRandom } from '@mailchain/crypto';
import { ED25519PrivateKey } from '@mailchain/crypto/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { fromEntropy, generate, toEntropy } from '@mailchain/crypto/mnemonic/mnemonic';
import {
	AuthApiInterface,
	EncryptedAccountSecretEncryptionIdEnum,
	EncryptedAccountSecretEncryptionKindEnum,
} from '../api';
import { OpaqueConfig } from './opaque';
import { accountAuthFinalize, accountAuthInit, decryptRootAccountKey } from './login';

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
		const accountEntropy = toEntropy(generate());

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
			).encrypt(accountEntropy);
			const mockAuthFinalizeResponse = {
				status: 200,
				data: {
					encryptedAccountSecret: {
						encryptedAccountSecret: encodeBase64(encryptedAccountKeySeed),
						encryptionId: EncryptedAccountSecretEncryptionIdEnum.Mnemonic,
					},
				},
			};
			mockAuthApi.accountAuthFinalize.mockResolvedValue(mockAuthFinalizeResponse as AxiosResponse);

			const res = await accountAuthFinalize(
				'username',
				mockKe2,
				mockAuthState,
				true,
				mockAuthApi,
				mockOpaqueConfig,
				mockOpaqueClient,
			);

			expect(res.clientSecretKey).toEqual(mockExportKey);
			expect(res.rootAccountKey).toEqual(ED25519PrivateKey.fromMnemonicPhrase(fromEntropy(accountEntropy)));
			expect(mockOpaqueClient.authFinish).toBeCalledWith(
				mockKe2,
				mockOpaqueConfig.serverIdentity,
				'username',
				mockOpaqueConfig.context,
			);
			expect(mockAuthApi.accountAuthFinalize).toBeCalledWith(
				{
					params: encodeBase64(ke3Serialized),
					createSessionCookie: true,
					authState: encodeBase64(mockAuthState),
				},
				{ withCredentials: true },
			);
		});
	});
});

describe('decryptRootAccountKey', () => {
	const clientSecretKey = secureRandom(32);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sha256(clientSecretKey)));

	it('should decrypt the root account key based on mnemonic phrase', async () => {
		const mnemonicPhrase = generate();
		const encryptedMnemonicPhrase = await encrypter.encrypt(toEntropy(mnemonicPhrase));

		const rootAccountKey = await decryptRootAccountKey(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			encryptionId: EncryptedAccountSecretEncryptionIdEnum.Mnemonic,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(rootAccountKey).toEqual(ED25519PrivateKey.fromMnemonicPhrase(mnemonicPhrase));
	});

	it('should decrypt the root account key based on key seed', async () => {
		const seed = secureRandom(32);
		const encryptedMnemonicPhrase = await encrypter.encrypt(seed);

		const rootAccountKey = await decryptRootAccountKey(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			encryptionId: EncryptedAccountSecretEncryptionIdEnum.Account,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(rootAccountKey).toEqual(ED25519PrivateKey.fromSeed(seed));
	});
});
