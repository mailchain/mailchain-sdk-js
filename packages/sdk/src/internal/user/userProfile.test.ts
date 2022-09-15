import { randomUUID } from 'crypto';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { ALGORAND, ETHEREUM, ProtocolType } from '@mailchain/addressing/protocols';
import { encodeAddressByProtocol } from '@mailchain/addressing';
import { encodeBase64 } from '@mailchain/encoding';
import { mock, MockProxy } from 'jest-mock-extended';
import { Decrypter, ED25519PublicKey, encodePublicKey, Encrypter, secureRandom } from '@mailchain/crypto';
import { user } from '../protobuf/user/user';
import { UserApiInterface } from '../api';
import { nopMigration } from '../migration';
import { MailchainUserProfile } from './userProfile';
import { Address } from './address';
import { UserAddressMigrationRule } from './migrations';

describe('userProfile', () => {
	let mockUserApi: MockProxy<UserApiInterface>;

	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

	const dummyIdentityKey1 = new ED25519PublicKey(secureRandom(32));
	const dummyIdentityKey2 = new ED25519PublicKey(secureRandom(32));
	const migratedDummyIdentityKey2 = new ED25519PublicKey(secureRandom(32));

	const dummyV1toV2Migration: UserAddressMigrationRule = {
		shouldApply: ({ version }) => Promise.resolve(version === 1),
		apply: (data) =>
			Promise.resolve({
				protoAddress: user.Address.create({
					...data.protoAddress,
					identityKey: encodePublicKey(migratedDummyIdentityKey2),
				}),
				version: 2,
			}),
	};

	beforeEach(() => {
		mockUserApi = mock();
		mockUserApi.postUserAddress.mockImplementation(() =>
			Promise.resolve({ data: { addressId: randomUUID() } } as any),
		);
	});

	it('should save addresses and retrieve them', async () => {
		// Bit hacky multiple cases in a single test, but in a way end-to-end test
		const userProfile = new MailchainUserProfile(mockUserApi, keyRing.userProfileCrypto(), dummyV1toV2Migration);

		const newAddresses = [
			{ identityKey: dummyIdentityKey1, address: '0x1337', nonce: 1, protocol: ETHEREUM, network: 'main' },
			{ identityKey: dummyIdentityKey2, address: 'geztgny', nonce: 1337, protocol: ALGORAND, network: 'test' },
		];

		// When - add the two addresses from expectedAddresses
		const newAddress1 = await userProfile.addAddress(newAddresses[0]);
		const newAddress2 = await userProfile.addAddress(newAddresses[1]);

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

		expect(actualAddresses).toEqual([
			{ ...newAddresses[0], id: newAddress1.id },
			{ ...newAddresses[1], id: newAddress2.id, identityKey: migratedDummyIdentityKey2 },
		]);
	});

	it('should update existing address', async () => {
		const mockCrypto = mock<Encrypter & Decrypter>();
		mockCrypto.encrypt.mockResolvedValue(new Uint8Array([1, 3, 3, 7]));
		const userProfile = new MailchainUserProfile(mockUserApi, mockCrypto, nopMigration());

		const address: Address = {
			id: '1337',
			address: '0x1337',
			identityKey: dummyIdentityKey1,
			nonce: 1338,
			protocol: ETHEREUM,
			network: 'main',
		};

		const resAddress = await userProfile.updateAddress('1337', address);

		const protoAddress = user.Address.decode(mockCrypto.encrypt.mock.calls[0][0]);
		expect(encodeAddressByProtocol(protoAddress.address, protoAddress.protocol as ProtocolType).encoded).toEqual(
			address.address,
		);
		expect(protoAddress.protocol).toEqual(address.protocol);
		expect(protoAddress.network).toEqual(address.network);
		expect(protoAddress.nonce).toEqual(1338);
		expect(mockUserApi.putUserAddress.mock.calls[0][0]).toEqual(address.id);
		expect(mockUserApi.putUserAddress.mock.calls[0][1]).toEqual({
			version: 2,
			encryptedAddressInformation: encodeBase64(new Uint8Array([1, 3, 3, 7])),
		});
		expect(resAddress).toEqual({ ...address, nonce: 1338 });
	});
});
