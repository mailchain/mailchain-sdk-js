import { cryptoWaitReady, sr25519DeriveHard } from '@polkadot/util-crypto';
import BN from 'bn.js';
import { ChainCodeFromDeriveIndex } from '..';
import { AsSR25519PrivateKey, SR25519ExtendedPrivateKey, SR25519PrivateKey } from '.';

export async function SR25519DeriveHardenedKey(
	parentKey: SR25519ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array | BN,
): Promise<SR25519ExtendedPrivateKey> {
	const ready = await cryptoWaitReady(); // needed before calling sr25519DeriveHard
	if (!ready) {
		throw new Error('crypto libraries could not be initialized');
	}

	const chainCode = ChainCodeFromDeriveIndex(index);
	const childKeypair = sr25519DeriveHard(AsSR25519PrivateKey(parentKey.PrivateKey).Keypair, chainCode);

	return SR25519ExtendedPrivateKey.FromPrivateKey(SR25519PrivateKey.FromKeypair(childKeypair));
}
