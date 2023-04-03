import { secp256r1 } from '@noble/curves/p256';
import { PublicKey } from '../public';
import { KindSECP256R1 } from '../keys';

export const SECP256R1PublicKeyLength = 33;

export class SECP256R1PublicKey implements PublicKey {
	readonly curve: string = KindSECP256R1;

	constructor(public readonly bytes: Uint8Array) {
		if (this.bytes.length !== SECP256R1PublicKeyLength) {
			throw RangeError('bytes are not a valid secp256r1 public key');
		}
	}

	async verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		return secp256r1.verify(sig, message, this.bytes);
	}
}
