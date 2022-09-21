import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { mock, MockProxy } from 'jest-mock-extended';
import { ED25519PublicKey, encodePublicKey, secureRandom } from '@mailchain/crypto';
import { AxiosResponse } from 'axios';
import { formatAddress } from '@mailchain/addressing';
import { user } from '../protobuf/user/user';
import {
	GetUserAddressesResponseBody,
	GetUsernameResponseBody,
	PostUserAddressResponseBody,
	UserApiInterface,
} from '../api';
import { nopMigration } from '../migration';
import { MailchainUserProfile, UserProfile } from './userProfile';
import { UserAddressMigrationRule } from './migrations';
import { AliceAccountMailbox, AliceWalletMailbox, BobWalletMailbox } from './test.const';

describe('userProfile', () => {
	let mockUserApi: MockProxy<UserApiInterface>;

	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const fetchIdentityKey = () => Promise.resolve(keyRing.accountIdentityKey().publicKey);

	const migratedIdentityKey = new ED25519PublicKey(secureRandom(32));
	const dummyMigration: UserAddressMigrationRule = {
		shouldApply: ({ version }) => Promise.resolve(version === 1),
		apply: (data) =>
			Promise.resolve({
				protoAddress: user.Address.create({
					...data.protoAddress,
					identityKey: encodePublicKey(migratedIdentityKey),
				}),
				version: 2,
			}),
	};

	const protoAddress1: user.Address = user.Address.create({
		address: AliceWalletMailbox.messagingKeyParams.address,
		identityKey: encodePublicKey(AliceWalletMailbox.identityKey),
		nonce: AliceWalletMailbox.messagingKeyParams.nonce,
		network: AliceWalletMailbox.messagingKeyParams.network,
		protocol: AliceWalletMailbox.messagingKeyParams.protocol,
	});

	const protoAddress2: user.Address = user.Address.create({
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
		mockUserApi.postUserAddress
			.mockResolvedValueOnce({
				data: { addressId: AliceWalletMailbox.id },
			} as AxiosResponse<PostUserAddressResponseBody>)
			.mockResolvedValueOnce({
				data: { addressId: BobWalletMailbox.id },
			} as AxiosResponse<PostUserAddressResponseBody>);
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

	it('should save addresses and retrieve them', async () => {
		// Bit hacky multiple cases in a single test, but in a way end-to-end test
		// When - add the two addresses from expectedAddresses
		const newAddress1 = await userProfile.addMailbox(AliceWalletMailbox);
		const newAddress2 = await userProfile.addMailbox(BobWalletMailbox);

		// Given - get the encrypted values from the invoked putAddress API request
		const apiAddresses = [
			{
				addressId: newAddress1.id,
				encryptedAddressInformation: mockUserApi.postUserAddress.mock.calls[0][0].encryptedAddressInformation,
				version: 2,
			},
			{
				addressId: newAddress2.id,
				encryptedAddressInformation: mockUserApi.postUserAddress.mock.calls[1][0].encryptedAddressInformation,
				version: 1,
			},
		];
		mockUserApi.getUserAddresses.mockResolvedValue({ data: { addresses: apiAddresses } } as any);

		// When - the user requests the address
		const actualMailboxes = await userProfile.mailboxes();

		// Then - the received addresses should be the same as the ones that were put

		expect(actualMailboxes).toEqual([AliceAccountMailbox, AliceWalletMailbox, BobWalletMailbox]);
	});

	it('should update existing address', async () => {
		const resMailbox = await userProfile.updateMailbox(AliceWalletMailbox.id, AliceWalletMailbox);

		const [addressId, postedData] = mockUserApi.putUserAddress.mock.calls[0];
		expect(addressId).toEqual(AliceWalletMailbox.id);
		const protoAddress = user.Address.decode(
			await keyRing.userProfileCrypto().decrypt(decodeBase64(postedData.encryptedAddressInformation)),
		);
		expect(protoAddress).toEqual(protoAddress1);
		expect(resMailbox).toEqual(AliceWalletMailbox);
	});

	it('should run migration on address and store the update', async () => {
		const encryptedAddressInformation = encodeBase64(
			await keyRing.userProfileCrypto().encrypt(user.Address.encode(protoAddress1).finish()),
		);
		mockUserApi.getUserAddresses.mockResolvedValue({
			data: { addresses: [{ encryptedAddressInformation, version: 1, addressId: AliceWalletMailbox.id }] },
		} as AxiosResponse<GetUserAddressesResponseBody>);

		const mailboxes = await userProfileWithMigration.mailboxes();

		expect(mailboxes).toEqual([AliceAccountMailbox, { ...AliceWalletMailbox, identityKey: migratedIdentityKey }]);
		expect(mockUserApi.putUserAddress.mock.calls[0][0]).toEqual(AliceWalletMailbox.id);
		expect(mockUserApi.putUserAddress.mock.calls[0][1].version).toEqual(2);
		expect(mockUserApi.putUserAddress.mock.calls[0][1].encryptedAddressInformation).toBeDefined();
	});
});
