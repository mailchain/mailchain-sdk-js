export interface PublicKey {
	readonly Bytes: Uint8Array;
	Verify: (message: Uint8Array, sig: Uint8Array) => Promise<boolean>;
}
