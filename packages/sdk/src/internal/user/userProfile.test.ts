import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { mock, MockProxy } from 'jest-mock-extended';
import { ED25519PublicKey, encodePublicKey, secureRandom } from '@mailchain/crypto';
import { AxiosResponse } from 'axios';
import { formatAddress } from '@mailchain/addressing';
import { user } from '../protobuf/user/user';
import {
	GetUserMailboxesResponseBody,
	GetUsernameResponseBody,
	PostUserMailboxResponseBody,
	UserApiInterface,
} from '../api';
import { nopMigration } from '../migration';
import { MailchainUserProfile, UserProfile } from './userProfile';
import { UserMailboxMigrationRule } from './migrations';
import { AliceAccountMailbox, AliceWalletMailbox, BobWalletMailbox } from './test.const';

describe('userProfile', () => {
	let mockUserApi: MockProxy<UserApiInterface>;

	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const fetchIdentityKey = () => Promise.resolve(keyRing.accountIdentityKey().publicKey);

	const migratedIdentityKey = new ED25519PublicKey(secureRandom(32));
	const dummyMigration: UserMailboxMigrationRule = {
		shouldApply: ({ version }) => Promise.resolve(version === 1),
		apply: (data) =>
			Promise.resolve({
				protoMailbox: user.Mailbox.create({
					...data.protoMailbox,
					identityKey: encodePublicKey(migratedIdentityKey),
				}),
				version: 2,
			}),
	};

	const protoMailbox1: user.Mailbox = user.Mailbox.create({
		address: AliceWalletMailbox.messagingKeyParams.address,
		identityKey: encodePublicKey(AliceWalletMailbox.identityKey),
		nonce: AliceWalletMailbox.messagingKeyParams.nonce,
		network: AliceWalletMailbox.messagingKeyParams.network,
		protocol: AliceWalletMailbox.messagingKeyParams.protocol,
	});

	const protoMailbox2: user.Mailbox = user.Mailbox.create({
		address: BobWalletMailbox.messagingKeyParams.address,
		identityKey: encodePublicKey(BobWalletMailbox.identityKey),
		nonce: BobWalletMailbox.messagingKeyParams.nonce,
		network: BobWalletMailbox.messagingKeyParams.network,
		protocol: BobWalletMailbox.messagingKeyParams.protocol,
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
				username: AliceAccountMailbox.sendAs[0].value,
				address: formatAddress(AliceAccountMailbox.sendAs[0], 'mail'),
			},
		} as AxiosResponse<GetUsernameResponseBody>);
		userProfile = new MailchainUserProfile(
			'mailchain.test',
			mockUserApi,
			fetchIdentityKey,
			keyRing.userProfileCrypto(),
			nopMigration(),
		);
		userProfileWithMigration = new MailchainUserProfile(
			'mailchain.test',
			mockUserApi,
			fetchIdentityKey,
			keyRing.userProfileCrypto(),
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
			await keyRing.userProfileCrypto().decrypt(decodeBase64(postedData.encryptedMailboxInformation)),
		);
		expect(protoMailbox).toEqual(protoMailbox1);
		expect(resMailbox).toEqual(AliceWalletMailbox);
	});

	it('should run migration on mailbox and store the update', async () => {
		const encryptedMailboxInformation = encodeBase64(
			await keyRing.userProfileCrypto().encrypt(user.Mailbox.encode(protoMailbox1).finish()),
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
});
