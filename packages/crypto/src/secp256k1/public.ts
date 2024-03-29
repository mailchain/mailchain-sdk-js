import secp256k1 from 'secp256k1';
import { PublicKey } from '../public';
import { KindSECP256K1 } from '../keys';

const { publicKeyVerify, publicKeyConvert, ecdsaVerify } = secp256k1;

export const SECP256K1PublicKeyLength = 33;

export class SECP256K1PublicKey implements PublicKey {
	readonly bytes: Uint8Array;
	readonly curve: string = KindSECP256K1;

	constructor(bytes: Uint8Array) {
		this.bytes = new Uint8Array();

		switch (bytes.length) {
			case 65:
				this.bytes = publicKeyConvert(bytes, true);
				break;
			case SECP256K1PublicKeyLength:
				this.bytes = bytes;
				break;
			default:
				throw RangeError('invalid public key length');
		}

		if (!publicKeyVerify(this.bytes)) {
			throw RangeError('bytes are not a valid ECDSA public key');
		}
	}
	/**
	 * fromSignature will return a public key from the message and signature. The returned key
	 * will validate the hash. Meaning message and signature pairs will return a public key.
	 * Additionally checks should be performed to ensure the public key is as expected.
	 * @param message
	 * @param signature
	 * @returns
	 */
	static async fromSignature(message: Uint8Array, signature: Uint8Array): Promise<SECP256K1PublicKey> {
		// abort if recId is not present
		if (signature.length !== 65) {
			throw Error('signature is missing recovery id');
		}

		const { recoverPublicKey } = await import('@ethersproject/signing-key');
		const recoveredKeyBytes = recoverPublicKey(message, signature);

		// TODO: this always returns a public key even if the recovered key does not match
		// the private key it was signed with. This should not be performed without knowing the address.
		// Need to include method to calculate address
		const pubKey = new SECP256K1PublicKey(Uint8Array.from(Buffer.from(recoveredKeyBytes.replace('0x', ''), 'hex')));

		return pubKey;
	}

	async verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		// remove rec id if present
		if (sig.length === 65) {
			sig = sig.slice(0, -1);
		}

		return ecdsaVerify(sig, message, this.bytes);
	}
}
