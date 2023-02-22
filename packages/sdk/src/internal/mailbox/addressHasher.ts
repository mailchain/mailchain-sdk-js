import { PublicKey } from '@mailchain/crypto';
import { parseNameServiceAddress, ProtocolType } from '@mailchain/addressing';
import { KeyRing } from '@mailchain/keyring';
import { sha3_256 } from '@noble/hashes/sha3';
import { MailAddress } from '../../transport';
import { AddressIdentityKeyResolver } from './addressIdentityKeyResolver';

export type AddressHash = { hash: Uint8Array; type: 'username' | 'identity-key' };

export type AddressesHasher = (addresses: string[]) => Promise<Map<string, AddressHash[]>>;

export function mailchainAddressHasher(
	identityKeyResolver: AddressIdentityKeyResolver,
	keyRing: KeyRing,
): AddressesHasher {
	const accountIdentityKey = keyRing.accountIdentityKey().publicKey;

	return async (addresses: string[]) => {
		const addressesHashes = new Map<string, AddressHash[]>();
		for (const address of addresses) {
			const nsAddress = parseNameServiceAddress(address);
			const addressHashes: AddressHash[] = [];
			try {
				const result = await identityKeyResolver(nsAddress);
				if (result) {
					const { identityKey, protocol } = result;
					const hash = createAddressIdentityKeyHash(accountIdentityKey, identityKey, protocol);
					addressHashes.push({ hash, type: 'identity-key' });
				}
			} catch (e) {
				console.warn(`failed creating AddressIdentityKey hash for address [${address}]`, e);
			}
			const hash = createAddressValueHash(accountIdentityKey, nsAddress.username);
			addressHashes.push({ hash, type: 'username' });

			addressesHashes.set(address, addressHashes);
		}
		return addressesHashes;
	};
}

function createAddressIdentityKeyHash(
	accountIdentity: PublicKey,
	addressIdentity: PublicKey,
	protocol: ProtocolType,
): Uint8Array {
	const input = new Uint8Array([...addressIdentity.bytes, ...Buffer.from(protocol), ...accountIdentity.bytes]);
	return sha3_256(input).slice(0, 16); // truncate to 16bytes
}

function createAddressValueHash(accountIdentity: PublicKey, addressValue: string): Uint8Array {
	const input = new Uint8Array([...Buffer.from(addressValue), ...accountIdentity.bytes]);
	return sha3_256(input).slice(0, 16); // truncate to 16bytes
}

/**
 * Get a single hash for the provided `address`
 *
 * @param hashMap the map containing all the hash for the address
 * @param address the address to get the hash for
 * @param types preference for the type of hash to get
 *
 * @throws Error if there is no hash of the desired type of the address
 */
export function getAddressHash(
	hashMap: Map<string, AddressHash[]>,
	address: string,
	...types: AddressHash['type'][]
): AddressHash['hash'] {
	const hashes = hashMap.get(address);
	if (hashes == null) throw new Error(`hash for address ${address} not found`);

	for (const type of types) {
		const typeHash = hashes.find((h) => h.type === type);
		if (typeHash != null) return typeHash.hash;
	}
	throw new Error(`hash of types [${types}] not found for address [${address}]`);
}

/**
 * Get all the hashes (of all types) for the provided `address`
 *
 * @param hashMap the map containing all the hash for the address
 * @param address the address to get the hashes for
 *
 * @throws Error if there is no hash for the address
 */
export function getAddressHashes(hashMap: Map<string, AddressHash[]>, address: string): Uint8Array[] {
	const hashes = hashMap.get(address);
	if (hashes == null || hashes.length === 0) throw new Error(`hash for address ${address} not found`);

	return hashes.map((h) => h.hash);
}

/**
 * Get all the hashes (of all the types) for all the provided `addresses`
 *
 * @param hashMap the map containing all the hashes for the addresses
 * @param addresses the addresses to get the hashes for
 *
 * @throws Error if for any of the provided addresses there is no hash
 */
export function getAddressesHashes(hashMap: Map<string, AddressHash[]>, addresses: string[]): Uint8Array[] {
	return addresses.flatMap((address) => getAddressHashes(hashMap, address));
}

/** Just utility wrapper around {@link getAddressesHashes} to support {@link MailAddress} for addresses */
export function getMailAddressesHashes(hashMap: Map<string, AddressHash[]>, addresses: MailAddress[]): Uint8Array[] {
	return getAddressesHashes(
		hashMap,
		addresses.map((a) => a.address),
	);
}
