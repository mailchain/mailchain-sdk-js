import { PublicKey } from '../';

export class UnknownPublicKey implements PublicKey {
	readonly Bytes: Uint8Array;

	constructor() {
		this.Bytes = new Uint8Array();
	}

	async Verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		return false;
	}
}

export const AliceUnknownPublicKey = new UnknownPublicKey();
