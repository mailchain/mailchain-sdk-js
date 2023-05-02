import { cryptoWaitReady } from '@polkadot/util-crypto/crypto';
import { sr25519DeriveHard } from '@polkadot/util-crypto/sr25519';
import { chainCodeFromDeriveIndex } from '../hd';
import { asSR25519PrivateKey, SR25519PrivateKey } from './private';
import { SR25519ExtendedPrivateKey } from './hd';

export async function sr25519DeriveHardenedKey(
	parentKey: SR25519ExtendedPrivateKey,
	index: string | number | bigint | Uint8Array,
): Promise<SR25519ExtendedPrivateKey> {
	const ready = await cryptoWaitReady(); // needed before calling sr25519DeriveHard
	if (!ready) {
		throw new Error('crypto libraries could not be initialized');
	}

	const chainCode = chainCodeFromDeriveIndex(index);
	const childKeyPair = sr25519DeriveHard(asSR25519PrivateKey(parentKey.privateKey).keyPair, chainCode);

	return SR25519ExtendedPrivateKey.fromPrivateKey(SR25519PrivateKey.fromKeyPair(childKeyPair));
}
