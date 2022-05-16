import { hashPersonalMessage } from 'ethereumjs-util';
import { ecdsaVerify } from 'secp256k1';
import { SECP256K1PublicKey } from '../secp256k1/public';
import { PublicKey } from '../public';
import { ErrorUnsupportedKey } from './errors';

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
			throw ErrorUnsupportedKey;
	}
}
