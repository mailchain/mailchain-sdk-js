import { PrivateKey, PublicKey } from '..';
import { UnknownPublicKey } from './public';

export const PrivateKeyLen = 32;

export class UnknownPrivateKey implements PrivateKey {
	Bytes: Uint8Array;
	PublicKey: PublicKey;

	constructor(bytes?: Uint8Array) {
		this.Bytes = bytes!;
		this.PublicKey = new UnknownPublicKey();
	}

	async Sign(message: Uint8Array): Promise<Uint8Array> {
		return new Uint8Array();
	}
}
