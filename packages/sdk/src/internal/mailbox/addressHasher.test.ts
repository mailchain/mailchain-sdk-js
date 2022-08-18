import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { encodePublicKey } from '@mailchain/crypto/multikey/encoding';
import { encodeHexZeroX } from '@mailchain/encoding';
import { KeyRing } from '@mailchain/keyring';
import { ETHEREUM, MAILCHAIN } from '@mailchain/addressing/protocols';
import { mailchainAddressHasher } from './addressHasher';

test('addressHasher should create unique 128bit hash of addresses', async () => {
	const mockAddressesApi = { getAddressIdentityKey: jest.fn() };
	mockAddressesApi.getAddressIdentityKey
		.mockResolvedValueOnce({
			data: {
				identityKey: encodeHexZeroX(encodePublicKey(BobED25519PublicKey)),
				protocol: ETHEREUM,
			},
		})
		.mockResolvedValueOnce({
			data: {
				identityKey: encodeHexZeroX(encodePublicKey(BobED25519PublicKey)),
				protocol: MAILCHAIN,
			},
		})
		.mockResolvedValueOnce({
			data: {
				identityKey: encodeHexZeroX(encodePublicKey(AliceED25519PublicKey)),
				protocol: ETHEREUM,
			},
		});
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const hasher = mailchainAddressHasher(mockAddressesApi as any, keyRing);

	const firstRes = await hasher(['0x1234']);
	const differentProtocol = await hasher(['0x1234']);
	const differentIdentityKey = await hasher(['0x1234']);

	expect(firstRes).not.toEqual(differentProtocol);
	expect(firstRes).not.toEqual(differentIdentityKey);
	expect(differentProtocol).not.toEqual(differentIdentityKey);
	expect(firstRes).toMatchSnapshot('firstRes');
	expect(differentProtocol).toMatchSnapshot('differentProtocol');
	expect(differentIdentityKey).toMatchSnapshot('differentIdentityKey');
});

test('addressHasher should create only address hash when identity key hash not available', async () => {
	const mockAddressesApi = { getAddressIdentityKey: jest.fn() };
	mockAddressesApi.getAddressIdentityKey.mockRejectedValue(new Error('Failed identity key fetch'));
	const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
	const hasher = mailchainAddressHasher(mockAddressesApi as any, keyRing);

	const res = await hasher(['0x1234']);

	expect(res['0x1234']).toHaveLength(1);
	expect(res['0x1234']![0]).toMatchSnapshot('address hash');
});
