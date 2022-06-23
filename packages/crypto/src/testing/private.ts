import { PrivateKey, PublicKey } from '..';
import { UnknownPublicKey } from './public';

export const PrivateKeyLen = 32;

export class UnknownPrivateKey implements PrivateKey {
	bytes: Uint8Array;
	publicKey: PublicKey;
	curve: string = 'testcurve';

	constructor(bytes?: Uint8Array) {
		this.bytes = bytes!;
		this.publicKey = new UnknownPublicKey();
	}

	async sign(message: Uint8Array): Promise<Uint8Array> {
		return new Uint8Array();
	}
}
