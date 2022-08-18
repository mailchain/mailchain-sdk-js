import { randomUUID } from 'crypto';
import { AliceED25519PrivateKey } from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { ALGORAND, ETHEREUM, ProtocolType } from '@mailchain/addressing/protocols';
import { encodeAddressByProtocol } from '@mailchain/addressing';
import { encodeBase64 } from '@mailchain/encoding';
import { user } from '../protobuf/user/user';
import { MailchainUserProfile } from './userProfile';
import { Address } from './address';

describe('userProfile', () => {
	it('should save addresses and retrieve them', async () => {
		// Bit hacky multiple cases in a single test, but in a way end-to-end test

		const postUserAddressFn = jest.fn();
		postUserAddressFn.mockImplementation(() => Promise.resolve({ data: { addressId: randomUUID() } }));
		const getUserAddressesFn = jest.fn();
		const userApi = {
			postUserAddress: postUserAddressFn,
			getUserAddresses: getUserAddressesFn,
		} as any;
		const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);

		// @ts-ignore
		const userProfile = new MailchainUserProfile(userApi, keyRing.userProfileCrypto());

		const newAddresses = [
			{ address: '0x1337', nonce: 1, protocol: ETHEREUM, network: 'main' },
			{ address: 'geztgny', nonce: 1337, protocol: ALGORAND, network: 'test' },
		];

		// When - add the two addresses from expectedAddresses
		const newAddress1 = await userProfile.addAddress(newAddresses[0]);
		const newAddress2 = await userProfile.addAddress(newAddresses[1]);

		// Given - get the encrypted values from the invoked putAddress API request
		const apiAddresses = [
			{
				addressId: newAddress1.id,
				encryptedAddressInformation: postUserAddressFn.mock.calls[0][0].encryptedAddressInformation,
			},
			{
				addressId: newAddress2.id,
				encryptedAddressInformation: postUserAddressFn.mock.calls[1][0].encryptedAddressInformation,
			},
		];
		getUserAddressesFn.mockReturnValue(Promise.resolve({ data: { addresses: apiAddresses } }));

		// When - the user requests the address
		const actualAddresses = await userProfile.addresses();

		// Then - the received addresses should be the same as the ones that were put

		expect(actualAddresses).toEqual([
			{ ...newAddresses[0], id: newAddress1.id },
			{ ...newAddresses[1], id: newAddress2.id },
		]);
	});

	it('should update existing address', async () => {
		const putUserAddressFn = jest.fn();
		const userApi = {
			putUserAddress: putUserAddressFn,
		} as any;
		const cryptoFn = {
			encrypt: jest.fn(),
			decrypt: jest.fn(),
		};
		cryptoFn.encrypt.mockReturnValue(new Uint8Array([1, 3, 3, 7]));
		// @ts-ignore
		const userProfile = new MailchainUserProfile(userApi, cryptoFn);

		const address: Address = { id: '1337', address: '0x1337', nonce: 1337, protocol: ETHEREUM, network: 'main' };

		const resAddress = await userProfile.updateAddress(address, 1338);

		const protoAddress = user.Address.decode(cryptoFn.encrypt.mock.calls[0][0]);
		expect(encodeAddressByProtocol(protoAddress.address, protoAddress.protocol as ProtocolType).encoded).toEqual(
			address.address,
		);
		expect(protoAddress.protocol).toEqual(address.protocol);
		expect(protoAddress.network).toEqual(address.network);
		expect(protoAddress.nonce).toEqual(1338);
		expect(putUserAddressFn.mock.calls[0][0]).toEqual(address.id);
		expect(putUserAddressFn.mock.calls[0][1]).toEqual({
			encryptedAddressInformation: encodeBase64(new Uint8Array([1, 3, 3, 7])),
		});
		expect(resAddress).toEqual({ ...address, nonce: 1338 });
	});
});
