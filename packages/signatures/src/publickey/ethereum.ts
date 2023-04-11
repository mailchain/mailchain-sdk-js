import { SECP256K1PublicKey } from '@mailchain/crypto';
import { encodeHex } from '@mailchain/encoding';
import isEqual from 'lodash/isEqual';
import { ETHEREUM, addressFromPublicKey } from '@mailchain/addressing';
import { getMessageHash } from '../eth_personal';

/**
 * Gets the public key from signature and compares it to the expected address to validate it's correct.
 *
 * The public key that {@link SECP256K1PublicKey.fromSignature} returns will verify the message with the signature.
 * However it's not guaranteed that the returned public key will be for the expected address.
 * @param message the message being signed
 * @param signature the signature of the message made with the private key part of the public key we are trying to extract
 */
export async function ethereumPublicKeyFromSignature(
	message: Uint8Array,
	signature: Uint8Array,
	expectedAddress: Uint8Array,
): Promise<SECP256K1PublicKey> {
	const messageHash = await getMessageHash(message);
	const publicKey = await SECP256K1PublicKey.fromSignature(messageHash, signature);

	const address = await addressFromPublicKey(publicKey, ETHEREUM);

	if (!isEqual(address, expectedAddress)) {
		throw new Error(
			`inconsistent public key calculated, expected address "${encodeHex(
				expectedAddress,
			)}" but actual is "${encodeHex(address)} (both hex encoded)"`,
		);
	}

	return publicKey;
}
