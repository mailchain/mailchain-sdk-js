import { hashMessage } from '@ethersproject/hash';
import { ecdsaSign, ecdsaVerify } from 'secp256k1';
import { PublicKey, PrivateKey, KindSECP256K1 } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';
import { ErrorUnsupportedKey } from './errors';

export function verifyEthereumPersonalMessage(key: PublicKey, message: Buffer, signature: Uint8Array): boolean {
	switch (key.curve) {
		case KindSECP256K1:
			// remove rec id if present
			if (signature.length === 65) {
				signature = signature.slice(0, -1);
			}

			const personalMessage = decodeHexZeroX(hashMessage(message));

			return ecdsaVerify(signature, Uint8Array.from(personalMessage), key.bytes);

		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export function signEthereumPersonalMessage(key: PrivateKey, message: Uint8Array): Uint8Array {
	switch (key.curve) {
		case KindSECP256K1:
			const personalMessage = decodeHexZeroX(hashMessage(message));

			const sigObj = ecdsaSign(personalMessage, key.bytes);

			const ret = new Uint8Array(65);
			ret.set(sigObj.signature, 0);
			ret.set(new Uint8Array([sigObj.recid]), 64);

			return ret;
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
