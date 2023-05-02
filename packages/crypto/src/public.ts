import isEqual from 'lodash/isEqual';

export interface PublicKey {
	readonly bytes: Uint8Array;
	verify: (message: Uint8Array, sig: Uint8Array) => Promise<boolean>;
	curve: string;
}

export function isPublicKeyEqual(a: PublicKey, b: PublicKey): boolean {
	return isEqual(a.bytes, b.bytes) && a.curve === b.curve;
}

export function isPublicKey(x: any): x is PublicKey {
	if (typeof x !== 'object') return false;
	if (!(x.bytes instanceof Uint8Array)) return false;
	if (!(x.verify instanceof Function)) return false;
	if (typeof x.curve !== 'string') return false;

	return true;
}
