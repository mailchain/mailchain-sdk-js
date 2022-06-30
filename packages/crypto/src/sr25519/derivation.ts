import { cryptoWaitReady, sr25519DeriveHard } from '@polkadot/util-crypto';
import BN from 'bn.js';
import { chainCodeFromDeriveIndex } from '..';
import { asSR25519PrivateKey, SR25519ExtendedPrivateKey, SR25519PrivateKey } from '.';

export async function SR25519DeriveHardenedKey(
	parentKey: SR25519ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array | BN,
): Promise<SR25519ExtendedPrivateKey> {
	const ready = await cryptoWaitReady(); // needed before calling sr25519DeriveHard
	if (!ready) {
		throw new Error('crypto libraries could not be initialized');
	}

	const chainCode = chainCodeFromDeriveIndex(index);
	const childKeyPair = sr25519DeriveHard(asSR25519PrivateKey(parentKey.privateKey).keyPair, chainCode);

	return SR25519ExtendedPrivateKey.fromPrivateKey(SR25519PrivateKey.fromKeyPair(childKeyPair));
}
