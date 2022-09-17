import isEqual from 'lodash/isEqual';

export interface PublicKey {
	readonly bytes: Uint8Array;
	verify: (message: Uint8Array, sig: Uint8Array) => Promise<boolean>;
	curve: string;
}

export function isPublicKeyEqual(a: PublicKey, b: PublicKey): boolean {
	return isEqual(a.bytes, b.bytes) && a.curve === b.curve;
}
