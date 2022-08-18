import { PublicKey, decodePublicKey } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';
import { ProtocolType } from '@mailchain/addressing';
import { KeyRing } from '@mailchain/keyring';
import { sha3_256 } from '@noble/hashes/sha3';
import { AddressesApiFactory } from '../api';

export type AddressesHasher = (addresses: string[]) => Promise<{ [address: string]: Uint8Array[] | undefined }>;

export function mailchainAddressHasher(
	addressesApi: ReturnType<typeof AddressesApiFactory>,
	keyRing: KeyRing,
): AddressesHasher {
	return async (addresses: string[]) => {
		const addressesHashes: { [address: string]: Uint8Array[] } = {};
		for (const address of addresses) {
			const addressHashes = [] as Uint8Array[];
			try {
				const { identityKey, protocol } = await addressesApi
					.getAddressIdentityKey(address)
					.then((res) => res.data);
				const cryptoPublicKey = decodePublicKey(decodeHexZeroX(identityKey!));
				const hash = createAddressIdentityKeyHash(
					keyRing.accountIdentityKey().publicKey,
					cryptoPublicKey,
					protocol as ProtocolType,
				);
				addressHashes.push(hash);
			} catch (e) {
				console.warn(`failed creating AddressIdentityKey hash for address [${address}]`, e);
			}
			const hash = createAddressValueHash(keyRing.accountIdentityKey().publicKey, address.split('@')[0]);
			addressHashes.push(hash);
			addressesHashes[address] = addressHashes;
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
