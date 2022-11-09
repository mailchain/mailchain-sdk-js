import { PublicKey } from '../public';

export class UnknownPublicKey implements PublicKey {
	readonly bytes: Uint8Array;
	readonly curve: string = 'testcurve';

	constructor() {
		this.bytes = new Uint8Array();
	}

	async verify(message: Uint8Array, sig: Uint8Array): Promise<boolean> {
		return false;
	}
}

export const AliceUnknownPublicKey = new UnknownPublicKey();
