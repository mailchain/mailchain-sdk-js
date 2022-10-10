import { ETHEREUM, ProtocolType } from '@mailchain/addressing';
import { PublicKey } from '@mailchain/crypto';
import { addressFromPublicKey as ethereumAddressFromPublicKey } from '../ethereum/address';

/**
 * Derive the address corresponding to the {@link PublicKey}.
 *
 * @param publicKey the key to derive the address from
 * @param protocol the protocol the address should be derived by
 *
 * @throws Error for unsupported protocols (only {@link ETHEREUM} supported) and for protocol unsupported key types.
 */
export function addressFromPublicKey(publicKey: PublicKey, protocol: ProtocolType): Promise<Uint8Array> {
	switch (protocol) {
		case ETHEREUM:
			return ethereumAddressFromPublicKey(publicKey);
		default:
			throw new Error(`address from PublicKey fro {${protocol}} not unsupported`);
	}
}
