export interface PublicKey {
	readonly bytes: Uint8Array;
	verify: (message: Uint8Array, sig: Uint8Array) => Promise<boolean>;
	curve: string;
}

/**
 * Compares two {@link PublicKey} objects for equality.
 * @param a The first {@link PublicKey} to compare.
 * @param b The second {@link PublicKey} to compare.
 * @returns True if both {@link PublicKey} are equal, false otherwise.
 */
export function isPublicKeyEqual(a: PublicKey, b: PublicKey): boolean {
	if (a.curve !== b.curve) {
		return false;
	}

	if (a.bytes.length !== a.bytes.length) {
		return false;
	}

	return a.bytes.every((value, index) => value === b.bytes[index]);
}

export function isPublicKey(x: any): x is PublicKey {
	if (typeof x !== 'object') return false;
	if (!(x.bytes instanceof Uint8Array)) return false;
	if (!(x.verify instanceof Function)) return false;
	if (typeof x.curve !== 'string') return false;

	return true;
}
