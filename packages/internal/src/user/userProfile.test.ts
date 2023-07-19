import { decodeBase64, decodeUtf8, encodeBase64 } from '@mailchain/encoding';
import { mock, MockProxy } from 'jest-mock-extended';
import { ED25519PublicKey, publicKeyToBytes, secureRandom } from '@mailchain/crypto';
import { AxiosResponse } from 'axios';
import { formatAddress } from '@mailchain/addressing';
import { aliceKeyRing } from '@mailchain/keyring/test.const';
import { AliceSECP256K1PublicAddressStr } from '@mailchain/addressing/protocols/ethereum/test.const';
import {
	GetUserMailboxesResponseBody,
	GetUsernameResponseBody,
	PostUserMailboxResponseBody,
	Setting,
	UserApiInterface,
} from '@mailchain/api';
import { user } from '../protobuf/user/user';
import { nopMigration } from '../migration';
import { MailchainUserProfile, UserProfile } from './userProfile';
import { UserMailboxMigrationRule } from './migrations';
import { AliceAccountMailbox, AliceWalletMailbox, BobWalletMailbox } from './test.const';

describe('userProfile', () => {
	let mockUserApi: MockProxy<UserApiInterface>;

	const fetchIdentityKey = () => Promise.resolve(aliceKeyRing.accountIdentityKey().publicKey);

	const migratedIdentityKey = new ED25519PublicKey(secureRandom(32));
	const dummyMigration: UserMailboxMigrationRule = {
		shouldApply: ({ version }) => Promise.resolve(version === 1),
		apply: (data) =>
			Promise.resolve({
				protoMailbox: user.Mailbox.create({
					...data.protoMailbox,
					identityKey: publicKeyToBytes(migratedIdentityKey),
				}),
				version: 2,
			}),
	};

	const protoMailbox1: user.Mailbox = user.Mailbox.create({
		address: AliceWalletMailbox.messagingKeyParams.address,
		identityKey: publicKeyToBytes(AliceWalletMailbox.identityKey),
		nonce: AliceWalletMailbox.messagingKeyParams.nonce,
		network: AliceWalletMailbox.messagingKeyParams.network,
		protocol: AliceWalletMailbox.messagingKeyParams.protocol,
		label: AliceWalletMailbox.label,
		aliases: [
			{
				address: `${AliceSECP256K1PublicAddressStr.toLowerCase()}@ethereum.mailchain.test`,
				blockSending: false,
				blockReceiving: false,
			},
		],
	});

	let userProfile: UserProfile;
	let userProfileWithMigration: UserProfile;

	beforeEach(() => {
		mockUserApi = mock();
		mockUserApi.postUserMailbox
			.mockResolvedValueOnce({
				data: { mailboxId: AliceWalletMailbox.id },
			} as AxiosResponse<PostUserMailboxResponseBody>)
			.mockResolvedValueOnce({
				data: { mailboxId: BobWalletMailbox.id },
			} as AxiosResponse<PostUserMailboxResponseBody>);
		mockUserApi.getUsername.mockResolvedValue({
			data: {
				username: AliceAccountMailbox.aliases[0].address.username,
				address: formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
			},
		} as AxiosResponse<GetUsernameResponseBody>);
		userProfile = new MailchainUserProfile(
			'mailchain.test',
			mockUserApi,
			fetchIdentityKey,
			aliceKeyRing.userMailboxCrypto(),
			aliceKeyRing.userSettingsCrypto(),
			nopMigration(),
		);
		userProfileWithMigration = new MailchainUserProfile(
			'mailchain.test',
			mockUserApi,
			fetchIdentityKey,
			aliceKeyRing.userMailboxCrypto(),
			aliceKeyRing.userSettingsCrypto(),
			dummyMigration,
		);
	});

	it('should save mailboxes and retrieve them', async () => {
		// Bit hacky multiple cases in a single test, but in a way end-to-end test
		// When - add the two mailboxes
		const newMailbox1 = await userProfile.addMailbox(AliceWalletMailbox);
		const newMailbox2 = await userProfile.addMailbox(BobWalletMailbox);

		// Given - get the encrypted values from the invoked postUserMailbox API request
		const apiMailboxes = [
			{
				mailboxId: newMailbox1.id,
				encryptedMailboxInformation: mockUserApi.postUserMailbox.mock.calls[0][0].encryptedMailboxInformation,
				version: 2,
			},
			{
				mailboxId: newMailbox2.id,
				encryptedMailboxInformation: mockUserApi.postUserMailbox.mock.calls[1][0].encryptedMailboxInformation,
				version: 1,
			},
		];
		mockUserApi.getUserMailboxes.mockResolvedValue({
			data: { mailboxes: apiMailboxes },
		} as AxiosResponse<GetUserMailboxesResponseBody>);

		// When - the user requests the mailboxes
		const actualMailboxes = await userProfile.mailboxes();

		// Then - the received mailboxes should be the same as the ones that were put
		expect(actualMailboxes).toEqual([AliceAccountMailbox, AliceWalletMailbox, BobWalletMailbox]);
	});

	it('should update existing mailbox', async () => {
		const resMailbox = await userProfile.updateMailbox(AliceWalletMailbox.id, AliceWalletMailbox);

		const [mailboxId, postedData] = mockUserApi.putUserMailbox.mock.calls[0];
		expect(mailboxId).toEqual(AliceWalletMailbox.id);
		const protoMailbox = user.Mailbox.decode(
			await aliceKeyRing.userMailboxCrypto().decrypt(decodeBase64(postedData.encryptedMailboxInformation)),
		);
		expect(protoMailbox).toEqual(protoMailbox1);
		expect(resMailbox).toEqual(AliceWalletMailbox);
	});

	it('should update existing mailbox with consolidated mailbox', async () => {
		const resMailbox = await userProfile.updateMailbox(AliceWalletMailbox.id, {
			...AliceWalletMailbox,
			aliases: [...AliceWalletMailbox.aliases, ...AliceWalletMailbox.aliases],
			label: '     ',
		});

		expect(resMailbox).toEqual({ ...AliceWalletMailbox, label: null });
	});

	it('should run migration on mailbox and store the update', async () => {
		const encryptedMailboxInformation = encodeBase64(
			await aliceKeyRing.userMailboxCrypto().encrypt(user.Mailbox.encode(protoMailbox1).finish()),
		);
		mockUserApi.getUserMailboxes.mockResolvedValue({
			data: { mailboxes: [{ encryptedMailboxInformation, version: 1, mailboxId: AliceWalletMailbox.id }] },
		} as AxiosResponse<GetUserMailboxesResponseBody>);

		const mailboxes = await userProfileWithMigration.mailboxes();

		expect(mailboxes).toEqual([AliceAccountMailbox, { ...AliceWalletMailbox, identityKey: migratedIdentityKey }]);
		expect(mockUserApi.putUserMailbox.mock.calls[0][0]).toEqual(AliceWalletMailbox.id);
		expect(mockUserApi.putUserMailbox.mock.calls[0][1].version).toEqual(2);
		expect(mockUserApi.putUserMailbox.mock.calls[0][1].encryptedMailboxInformation).toBeDefined();
	});

	it('should set string setting', async () => {
		await userProfile.setSetting('key', 'value');

		expect(mockUserApi.putUserSetting).toHaveBeenCalledWith('key', { value: 'value', kind: 'string' });
	});

	it('should set encrypted setting', async () => {
		await userProfile.setSetting('key', 'value', { secure: true });

		expect(mockUserApi.putUserSetting).toHaveBeenCalledWith(
			'key',
			expect.objectContaining({ value: expect.any(String), kind: 'encrypted' }),
		);
		const encryptedValue = mockUserApi.putUserSetting.mock.calls[0][1].value as string;
		expect(await aliceKeyRing.userSettingsCrypto().decrypt(decodeBase64(encryptedValue))).toEqual(
			decodeUtf8('value'),
		);
	});

	it('should get string setting', async () => {
		mockUserApi.getUserSetting.calledWith('key').mockResolvedValue({
			data: { name: 'key', group: 'generic', isSet: true, value: 'value', kind: 'string' } as Setting,
		} as AxiosResponse<Setting>);

		const value = await userProfile.getSetting('key');

		expect(value).toEqual({ name: 'key', group: 'generic', isSet: true, value: 'value', kind: 'string' });
	});

	it('should get encrypted setting', async () => {
		mockUserApi.getUserSetting.calledWith('key').mockResolvedValue({
			data: {
				name: 'key',
				group: 'generic',
				isSet: true,
				value: encodeBase64(await aliceKeyRing.userSettingsCrypto().encrypt(decodeUtf8('value'))),
				kind: 'encrypted',
			} as Setting,
		} as AxiosResponse<Setting>);

		const value = await userProfile.getSetting('key');

		expect(value).toEqual({ name: 'key', group: 'generic', isSet: true, value: 'value', kind: 'encrypted' });
	});

	it.failing('should get settings by group', async () => {
		await userProfile.getSettings('generic');
	});
});
