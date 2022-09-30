import { ed25519DeriveHard } from '@polkadot/util-crypto';
import { asED25519PrivateKey } from './private';
import { ED25519PrivateKey } from './private';
import { chainCodeFromDeriveIndex, ExtendedPrivateKey } from '../hd';
import { ED25519ExtendedPrivateKey } from './exprivate';

export function ed25519DeriveHardenedKey(
	parentKey: ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array,
): ED25519ExtendedPrivateKey {
	const chainCode = chainCodeFromDeriveIndex(index);
	const seed = asED25519PrivateKey(parentKey.privateKey).bytes.slice(0, 32);
	const child = ed25519DeriveHard(seed, chainCode);

	return ED25519ExtendedPrivateKey.fromPrivateKey(ED25519PrivateKey.fromSeed(child));
}
