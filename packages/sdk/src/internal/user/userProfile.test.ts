import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { ETHEREUM } from '@mailchain/addressing/protocols';
import { decodeAddressByProtocol, encodeAddressByProtocol } from '@mailchain/addressing';
import { decodeBase64, encodeBase64 } from '@mailchain/encoding';
import { mock, MockProxy } from 'jest-mock-extended';
import { ED25519PublicKey, encodePublicKey, secureRandom } from '@mailchain/crypto';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { AxiosResponse } from 'axios';
import { user } from '../protobuf/user/user';
import { GetUserAddressesResponseBody, PostUserAddressResponseBody, UserApiInterface } from '../api';
import { nopMigration } from '../migration';
import { AliceSECP256K1PublicAddress, BobSECP256K1PublicAddress } from '../ethereum/test.const';
import { MailchainUserProfile } from './userProfile';
import { Address } from './address';
import { UserAddressMigrationRule } from './migrations';

describe('userProfile', () => {
	let mockUserApi: MockProxy<UserApiInterface>;

	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

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

	const address1: Address = {
		id: 'address1-id',
		address: encodeAddressByProtocol(AliceSECP256K1PublicAddress, ETHEREUM).encoded,
		identityKey: AliceSECP256K1PublicKey,
		nonce: 1,
		network: 'main',
		protocol: ETHEREUM,
	};
	const protoAddress1: user.Address = user.Address.create({
		address: decodeAddressByProtocol(address1.address, address1.protocol).decoded,
		identityKey: encodePublicKey(address1.identityKey),
		nonce: address1.nonce,
		network: address1.network,
		protocol: address1.protocol,
	});
	const address2: Address = {
		id: 'address2-id',
		address: encodeAddressByProtocol(BobSECP256K1PublicAddress, ETHEREUM).encoded,
		identityKey: BobSECP256K1PublicKey,
		nonce: 20,
		network: 'main',
		protocol: ETHEREUM,
	};
	const protoAddress2: user.Address = user.Address.create({
		address: decodeAddressByProtocol(address2.address, address2.protocol).decoded,
		identityKey: encodePublicKey(address2.identityKey),
		nonce: address2.nonce,
		network: address2.network,
		protocol: address2.protocol,
	});

	beforeEach(() => {
		mockUserApi = mock();
		mockUserApi.postUserAddress
			.mockResolvedValueOnce({
				data: { addressId: address1.id },
			} as AxiosResponse<PostUserAddressResponseBody>)
			.mockResolvedValueOnce({
				data: { addressId: address2.id },
			} as AxiosResponse<PostUserAddressResponseBody>);
	});

	it('should save addresses, migrate second address and retrieve them', async () => {
		// Bit hacky multiple cases in a single test, but in a way end-to-end test
		const userProfile = new MailchainUserProfile(mockUserApi, keyRing.userProfileCrypto(), dummyMigration);

		// When - add the two addresses from expectedAddresses
		const newAddress1 = await userProfile.addAddress(address1);
		const newAddress2 = await userProfile.addAddress(address2);

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
		const actualAddresses = await userProfile.addresses();

		// Then - the received addresses should be the same as the ones that were put

		expect(actualAddresses).toEqual([address1, { ...address2, identityKey: migratedIdentityKey }]);
	});

	it('should update existing address', async () => {
		const userProfile = new MailchainUserProfile(mockUserApi, keyRing.userProfileCrypto(), nopMigration());

		const resAddress = await userProfile.updateAddress(address1.id, address1);

		const [addressId, postedData] = mockUserApi.putUserAddress.mock.calls[0];
		expect(addressId).toEqual(address1.id);
		const protoAddress = user.Address.decode(
			await keyRing.userProfileCrypto().decrypt(decodeBase64(postedData.encryptedAddressInformation)),
		);
		expect(protoAddress).toEqual(protoAddress1);
		expect(resAddress).toEqual(address1);
	});

	it('should run migration on address and store the update', async () => {
		const encryptedAddressInformation = encodeBase64(
			await keyRing.userProfileCrypto().encrypt(user.Address.encode(protoAddress1).finish()),
		);
		mockUserApi.getUserAddresses.mockResolvedValue({
			data: { addresses: [{ encryptedAddressInformation, version: 1, addressId: address1.id }] },
		} as AxiosResponse<GetUserAddressesResponseBody>);
		const userProfile = new MailchainUserProfile(mockUserApi, keyRing.userProfileCrypto(), dummyMigration);

		const addresses = await userProfile.addresses();

		expect(addresses).toEqual([{ ...address1, identityKey: migratedIdentityKey }]);
		expect(mockUserApi.putUserAddress.mock.calls[0][0]).toEqual(address1.id);
		expect(mockUserApi.putUserAddress.mock.calls[0][1].version).toEqual(2);
		expect(mockUserApi.putUserAddress.mock.calls[0][1].encryptedAddressInformation).toBeDefined();
	});
});
