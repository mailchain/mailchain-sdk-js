import { ecdsaSign, ecdsaVerify } from 'secp256k1';
import { PublicKey, PrivateKey, KindSECP256K1, ErrorUnsupportedKey } from '@mailchain/crypto';
import { decodeHexZeroX } from '@mailchain/encoding';

export async function verifyEthereumPersonalMessage(
	key: PublicKey,
	message: Uint8Array,
	signature: Uint8Array,
): Promise<boolean> {
	switch (key.curve) {
		case KindSECP256K1:
			// remove rec id if present
			if (signature.length === 65) {
				signature = signature.slice(0, -1);
			}

			const { hashMessage } = await import('@ethersproject/hash');
			const personalMessage = decodeHexZeroX(hashMessage(message));

			return ecdsaVerify(signature, Uint8Array.from(personalMessage), key.bytes);

		default:
			throw new ErrorUnsupportedKey(key.curve);
	}
}

export async function signEthereumPersonalMessage(key: PrivateKey, message: Uint8Array): Promise<Uint8Array> {
	switch (key.curve) {
		case KindSECP256K1:
			const { hashMessage } = await import('@ethersproject/hash');
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
