import {
	AliceED25519PrivateKey,
	AliceED25519PublicKey,
	BobED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { KeyRing } from '@mailchain/keyring';
import { ETHEREUM, MAILCHAIN } from '@mailchain/addressing/protocols';
import { sha256 } from '@noble/hashes/sha256';
import {
	AddressHash,
	getAddressesHashes,
	getAddressHash,
	getAddressHashes,
	mailchainAddressHasher,
} from './addressHasher';
import { AddressIdentityKeyResolver } from './addressIdentityKeyResolver';

describe('addressHasher', () => {
	let identityKeyResolver: jest.Mock<ReturnType<AddressIdentityKeyResolver>, Parameters<AddressIdentityKeyResolver>>;

	beforeEach(() => {
		identityKeyResolver = jest.fn();
	});
	it('should create unique 128bit hash of addresses', async () => {
		identityKeyResolver
			.mockResolvedValueOnce({
				identityKey: BobED25519PublicKey,
				protocol: ETHEREUM,
			})
			.mockResolvedValueOnce({
				identityKey: BobED25519PublicKey,
				protocol: MAILCHAIN,
			})
			.mockResolvedValueOnce({
				identityKey: AliceED25519PublicKey,
				protocol: ETHEREUM,
			});
		const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
		const hasher = mailchainAddressHasher(identityKeyResolver, keyRing);

		const firstRes = await hasher(['0x1234@mailchain.com']);
		const differentProtocol = await hasher(['0x1234@mailchain.com']);
		const differentIdentityKey = await hasher(['0x1234@mailchain.com']);

		expect(firstRes).not.toEqual(differentProtocol);
		expect(firstRes).not.toEqual(differentIdentityKey);
		expect(differentProtocol).not.toEqual(differentIdentityKey);
		expect(firstRes).toMatchSnapshot('firstRes');
		expect(differentProtocol).toMatchSnapshot('differentProtocol');
		expect(differentIdentityKey).toMatchSnapshot('differentIdentityKey');
	});

	it('should create only address hash when identity key hash not available', async () => {
		const keyRing = KeyRing.fromPrivateKey(AliceED25519PrivateKey);
		identityKeyResolver.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('test'));
		const hasher = mailchainAddressHasher(identityKeyResolver, keyRing);
		const addresses = ['0x1234@mailchain.com', 'alice@mailchain.com'];

		const res = await hasher(addresses);

		addresses.forEach((address) => {
			expect(res.get(address)).toHaveLength(1);
			expect(res.get(address)![0].hash).toMatchSnapshot('address hash');
			expect(res.get(address)![0].type).toEqual('username');
		});
	});
});

describe('addressHashes getters', () => {
	it('should get hash of type username', () => {
		const map = new Map<string, AddressHash[]>([['address', [{ hash: sha256('username'), type: 'username' }]]]);

		const hash = getAddressHash(map, 'address', 'username');

		expect(hash).toEqual(sha256('username'));
	});

	it('should get hash of type identity-key when username type is not available', () => {
		const map = new Map<string, AddressHash[]>([
			['address', [{ hash: sha256('identity-key'), type: 'identity-key' }]],
		]);

		const hash = getAddressHash(map, 'address', 'username', 'identity-key');

		expect(hash).toEqual(sha256('identity-key'));
	});

	it('should throw when no hash for address available', () => {
		const map = new Map<string, AddressHash[]>();

		expect(() => getAddressHash(map, 'address', 'username')).toThrow();
	});

	it('should throw when no hash of type for address available', () => {
		const map = new Map<string, AddressHash[]>([
			['address', [{ hash: sha256('identity-key'), type: 'identity-key' }]],
		]);
		expect(() => getAddressHash(map, 'address', 'username')).toThrow();
	});

	it('should get all hashes for address', () => {
		const map = new Map<string, AddressHash[]>([
			[
				'address',
				[
					{ hash: sha256('identity-key'), type: 'identity-key' },
					{ hash: sha256('username'), type: 'username' },
					{ hash: sha256('username-2'), type: 'username' },
				],
			],
		]);

		const hashes = getAddressHashes(map, 'address');

		expect(hashes).toEqual([sha256('identity-key'), sha256('username'), sha256('username-2')]);
	});

	it('should fail getting all hashes for address', () => {
		const map = new Map<string, AddressHash[]>([['address', []]]);

		expect(() => getAddressHashes(map, 'address')).toThrow();
		expect(() => getAddressHashes(map, 'invalid-address')).toThrow();
	});

	it('should get all hashes for multiple address', () => {
		const map = new Map<string, AddressHash[]>([
			['address-1', [{ hash: sha256('address-1'), type: 'username' }]],
			['address-2', [{ hash: sha256('address-2'), type: 'identity-key' }]],
			['address-3', [{ hash: sha256('address-3'), type: 'username' }]],
		]);

		const hashes = getAddressesHashes(map, ['address-1', 'address-2', 'address-3']);

		expect(hashes).toEqual([sha256('address-1'), sha256('address-2'), sha256('address-3')]);
	});

	it('should fail getting all hashes for multiple addresses when there is address without hashes', () => {
		const map = new Map<string, AddressHash[]>([
			['address-1', [{ hash: sha256('address-1'), type: 'username' }]],
			['address-2', [{ hash: sha256('address-2'), type: 'identity-key' }]],
			['empty-address', []],
		]);

		expect(() => getAddressesHashes(map, ['address-1', 'invalid-address', 'address-2'])).toThrow();
		expect(() => getAddressesHashes(map, ['address-1', 'empty-address', 'address-2'])).toThrow();
	});
});
