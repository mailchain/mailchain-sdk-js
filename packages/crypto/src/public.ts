export interface PublicKey {
	readonly bytes: Uint8Array;
	verify: (message: Uint8Array, sig: Uint8Array) => Promise<boolean>;
	curve: string;
}
