import { blake2b } from '@noble/hashes/blake2b';
import { chainCodeFromDeriveIndex, ExtendedPrivateKey } from '../hd';
import { asED25519PrivateKey, ED25519PrivateKey } from './private';
import { ED25519ExtendedPrivateKey } from './hd';

// 'Ed25519HDKD' encoded with length prefix
const HDKD = new Uint8Array([44, 69, 100, 50, 53, 53, 49, 57, 72, 68, 75, 68]);

export function ed25519DeriveHardenedKey(
	parentKey: ExtendedPrivateKey,
	index: string | number | Uint8Array,
): ED25519ExtendedPrivateKey {
	const chainCode = chainCodeFromDeriveIndex(index);
	const seed = asED25519PrivateKey(parentKey.privateKey).bytes.slice(0, 32);

	return ED25519ExtendedPrivateKey.fromPrivateKey(
		ED25519PrivateKey.fromSeed(
			blake2b(Uint8Array.from([...HDKD, ...seed, ...chainCode]), {
				dkLen: 256 / 8,
			}),
		),
	);
}
