import { secp256r1 } from '@noble/curves/p256';
import { RandomFunction, secureRandom } from '../rand';
import { KindSECP256R1 } from '../keys';
import { PrivateKey } from '../private';
import { SECP256R1PublicKey } from './public';
export const SECP256R1PrivateKeyLen = 32;

export class SECP256R1PrivateKey implements PrivateKey {
	readonly publicKey: SECP256R1PublicKey;
	readonly curve: string = KindSECP256R1;

	constructor(public readonly bytes: Uint8Array, private readonly rand: RandomFunction = secureRandom) {
		if (this.bytes.length !== SECP256R1PrivateKeyLen || !secp256r1.utils.isValidPrivateKey(this.bytes)) {
			throw RangeError('bytes are not a valid secp256r1 private key');
		}
		this.publicKey = new SECP256R1PublicKey(secp256r1.getPublicKey(this.bytes));
		this.curve = KindSECP256R1;
	}

	static generate(rand: RandomFunction = secureRandom): SECP256R1PrivateKey {
		return new SECP256R1PrivateKey(rand(), rand);
	}
	async sign(message: Uint8Array): Promise<Uint8Array> {
		const sig = secp256r1.sign(message, this.bytes, { lowS: true, extraEntropy: this.rand() });
		return sig.toCompactRawBytes();
	}
}
