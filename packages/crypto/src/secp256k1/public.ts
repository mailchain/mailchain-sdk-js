import { publicKeyVerify, publicKeyConvert, ecdsaVerify } from 'secp256k1';
import { DecodeHexZeroX } from '@mailchain/encoding';
import { hashMessage, recoverPublicKey } from 'ethers/lib/utils';
import { PublicKey } from '../';

export class SECP256K1PublicKey implements PublicKey {
	readonly Bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		this.Bytes = new Uint8Array();

		switch (bytes.length) {
			case 65:
				this.Bytes = publicKeyConvert(bytes, true);
				break;
			case 33:
				this.Bytes = bytes;
				break;
			default:
				throw RangeError('invalid public key length');
		}

		if (!publicKeyVerify(this.Bytes)) {
			throw RangeError('bytes are not a valid ECDSA public key');
		}
	}
	/**
	 * FromSignature will return a public key from the message and signature. The returned key
	 * will validate the hash. Meaning message and signature pairs will return a public key.
	 * Additionally checks should be performed to ensure the public key is as expected.
	 * @param message
	 * @param signature
	 * @returns
	 */
	static async FromSignature(message: Uint8Array, signature: Uint8Array): Promise<SECP256K1PublicKey> {
		// abort if recId is not present
		if (signature.length !== 65) {
			throw Error('signature is missing recovery id');
		}

		const dataBytes = DecodeHexZeroX(hashMessage(Buffer.from(message)));
		const recoveredKeyBytes = recoverPublicKey(dataBytes, signature);

		// TODO: this always returns a public key even if the recovered key does not match
		// the private key it was signed with. This should not be peformed without knowing the address.
		// Need to include method to caluluate address
		const pubKey = new SECP256K1PublicKey(DecodeHexZeroX(recoveredKeyBytes));

		return pubKey;
	}

	async Verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		// remove rec id if present
		if (sig.length === 65) {
			sig = sig.slice(0, -1);
		}

		// Verify as personal ethereum message
		const messageToVerify = DecodeHexZeroX(hashMessage(Buffer.from(message)));

		return ecdsaVerify(sig, messageToVerify, this.Bytes);
	}
}
