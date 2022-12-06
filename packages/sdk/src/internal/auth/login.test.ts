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
	EncryptedAccountSecretSecretKindEnum,
	EncryptedAccountSecretEncryptionKindEnum,
	EncryptedAccountSecret,
} from '../api';
import { OpaqueConfig } from './opaque';
import { accountAuthFinalize, accountAuthInit, createRootAccountKey, decryptAccountSecret } from './login';

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
						secretKind: EncryptedAccountSecretSecretKindEnum.Mnemonic,
					} as EncryptedAccountSecret,
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

describe('decryptAccountSecret', () => {
	const clientSecretKey = secureRandom(32);
	const encrypter = PrivateKeyEncrypter.fromPrivateKey(ED25519PrivateKey.fromSeed(sha256(clientSecretKey)));

	it('should decrypt the account secret based on mnemonic phrase', async () => {
		const mnemonicPhrase = generate();
		const encryptedMnemonicPhrase = await encrypter.encrypt(toEntropy(mnemonicPhrase));

		const rootAccountKey = await decryptAccountSecret(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			secretKind: EncryptedAccountSecretSecretKindEnum.Mnemonic,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(rootAccountKey).toEqual({ kind: 'mnemonic-phrase', value: toEntropy(mnemonicPhrase) });
	});

	it('should decrypt the account secret based on key seed', async () => {
		const seed = secureRandom(32);
		const encryptedMnemonicPhrase = await encrypter.encrypt(seed);

		const accountSecret = await decryptAccountSecret(clientSecretKey, {
			encryptedAccountSecret: encodeBase64(encryptedMnemonicPhrase),
			secretKind: EncryptedAccountSecretSecretKindEnum.Account,
			encryptionKind: EncryptedAccountSecretEncryptionKindEnum.Opaque,
			encryptionVersion: 1,
		});

		expect(accountSecret).toEqual({ kind: 'key-seed', value: seed });
	});
});

describe('createRootAccountKey', () => {
	it('create key from mnemonic phrase', () => {
		const mnemonicPhrase = generate();

		const key = createRootAccountKey({ kind: 'mnemonic-phrase', value: toEntropy(mnemonicPhrase) });

		expect(key).toEqual(ED25519PrivateKey.fromMnemonicPhrase(mnemonicPhrase));
	});

	it('create key from seed', () => {
		const seed = secureRandom(32);

		const key = createRootAccountKey({ kind: 'key-seed', value: seed });

		expect(key).toEqual(ED25519PrivateKey.fromSeed(seed));
	});
});
