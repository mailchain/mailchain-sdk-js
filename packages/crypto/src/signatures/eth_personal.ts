import { hashPersonalMessage } from 'ethereumjs-util';
import { ecdsaSign, ecdsaVerify } from 'secp256k1';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { ErrorUnsupportedKey } from './errors';
import { SECP256K1PrivateKey } from '../secp256k1';

export function VerifyEthereumPersonalMessage(key: PublicKey, message: Buffer, signature: Uint8Array): boolean {
	switch (key.constructor) {
		case SECP256K1PublicKey:
			// remove rec id if present
			if (signature.length === 65) {
				signature = signature.slice(0, -1);
			}
			const personalMessage = hashPersonalMessage(message);
			return ecdsaVerify(signature, Uint8Array.from(personalMessage), key.Bytes);

		default:
			throw new ErrorUnsupportedKey();
	}
}

export function SignEthereumPersonalMessage(key: PrivateKey, message: Buffer): Uint8Array {
	switch (key.constructor) {
		case SECP256K1PrivateKey:
			const personalMessage = hashPersonalMessage(message);

			const sigObj = ecdsaSign(personalMessage, key.Bytes);

			const ret = new Uint8Array(65);
			ret.set(sigObj.signature, 0);
			ret.set(new Uint8Array([sigObj.recid]), 64);

			return ret;
		default:
			throw new ErrorUnsupportedKey();
	}
}
