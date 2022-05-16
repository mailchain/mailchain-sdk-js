import { ed25519DeriveHard } from '@polkadot/util-crypto';
import BN from 'bn.js';
import { ChainCodeFromDeriveIndex, ExtendedPrivateKey } from '..';
import { AsED25519PrivateKey, ED25519ExtendedPrivateKey, ED25519PrivateKey } from '.';

export function DeriveHardenedKey(
	parentKey: ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array | BN,
): ED25519ExtendedPrivateKey {
	const chainCode = ChainCodeFromDeriveIndex(index);
	const seed = AsED25519PrivateKey(parentKey.PrivateKey).Bytes.slice(0, 32);
	const child = ed25519DeriveHard(seed, chainCode);

	return ED25519ExtendedPrivateKey.FromPrivateKey(ED25519PrivateKey.FromSeed(child));
}
