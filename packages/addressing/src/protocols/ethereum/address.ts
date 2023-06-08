import { KindSECP256K1, PublicKey } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';

/**
 * Derive the ethereum address corresponding to the {@link PublicKey}.
 *
 * @param publicKey must be with with {@link KindSECP256K1} curve
 * @throw if the provided key is on unsupported curve
 */
export async function addressFromPublicKey(publicKey: PublicKey): Promise<Uint8Array> {
	if (publicKey.curve !== KindSECP256K1) {
		throw new Error(`public key must be ${KindSECP256K1}`);
	}
	const { computeAddress } = await import('@ethersproject/transactions');

	return decodeHexZeroX(computeAddress(publicKey.bytes));
}

export function validateEthereumAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}/.test(address);
}
