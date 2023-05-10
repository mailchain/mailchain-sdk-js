import { PublicKey } from '../public';
import { PrivateKey } from '../private';
import { UnknownPublicKey } from './public';

export const PrivateKeyLen = 32;

export class UnknownPrivateKey implements PrivateKey {
	bytes: Uint8Array;
	publicKey: PublicKey;
	curve = 'testcurve';

	constructor(bytes?: Uint8Array) {
		this.bytes = bytes!;
		this.publicKey = new UnknownPublicKey();
	}

	async sign(_message: Uint8Array): Promise<Uint8Array> {
		return new Uint8Array();
	}
}
