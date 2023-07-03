import { PublicKey } from '@mailchain/crypto';
import { ETHEREUM, ProtocolType, TEZOS } from './protocols';
import { addressFromPublicKey as ethereumAddressFromPublicKey } from './protocols/ethereum/address';
import { tezosAddressFromPublicKey } from './protocols/tezos/address';

/**
 * Derive the address corresponding to the {@link PublicKey}.
 *
 * @param publicKey the key to derive the address from
 * @param protocol the protocol the address should be derived by
 *
 * @throws Error for unsupported protocols (only {@link ETHEREUM} supported) and for protocol unsupported key types.
 */
export async function addressFromPublicKey(publicKey: PublicKey, protocol: ProtocolType): Promise<Uint8Array> {
	switch (protocol) {
		case ETHEREUM:
			return ethereumAddressFromPublicKey(publicKey);
		case TEZOS:
			return tezosAddressFromPublicKey(publicKey);
		default:
			throw new Error(`address from PublicKey for {${protocol}} not unsupported`);
	}
}
