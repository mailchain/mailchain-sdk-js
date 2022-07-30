import { hashPersonalMessage } from 'ethereumjs-util';
import { ecdsaSign, ecdsaVerify } from 'secp256k1';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { KindSECP256K1 } from '../keys';
import { ErrorUnsupportedKey } from './errors';

export function verifyEthereumPersonalMessage(key: PublicKey, message: Buffer, signature: Uint8Array): boolean {
	switch (key.constructor) {
		case SECP256K1PublicKey:
			// remove rec id if present
			if (signature.length === 65) {
				signature = signature.slice(0, -1);
			}
			const personalMessage = hashPersonalMessage(message);
			return ecdsaVerify(signature, Uint8Array.from(personalMessage), key.bytes);

		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export function signEthereumPersonalMessage(key: PrivateKey, message: Uint8Array): Uint8Array {
	switch (key.curve) {
		case KindSECP256K1:
			const personalMessage = new Uint8Array(hashPersonalMessage(Buffer.from(message)));

			const sigObj = ecdsaSign(personalMessage, key.bytes);

			const ret = new Uint8Array(65);
			ret.set(sigObj.signature, 0);
			ret.set(new Uint8Array([sigObj.recid]), 64);

			return ret;
		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}
