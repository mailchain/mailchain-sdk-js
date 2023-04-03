// KindSECP256K1 string identifier for secp256k1 keys.
export const KindSECP256K1 = 'secp256k1';
// KindED25519 string identifier for ed25519 keys.
export const KindED25519 = 'ed25519';
// KindSECP256R1 string identifier for P256 keys.
export const KindSECP256R1 = 'secp256r1';
// KindSR25519 string identifier for sr25519 keys.
export const KindSR25519 = 'sr25519';
// KindNoOp string identifier for no-operation keys.
export const KindNoOp = 'noop';

// IdSECP256K1 Id identifier for secp256k1 keys.
export const IdSECP256K1 = 0xe1;
// IdED25519 Id identifier for ed25519 keys.
export const IdED25519 = 0xe2;
// IdSR25519 Id identifier for sr25519 keys.
export const IdSR25519 = 0xe3;
// IdSECP256R1 Id identifier for SECP256R1 keys.
export const IdSECP256R1 = 0xe4;

// IdNonSpecified Id identifier for non specified secret keys.
export const IdNonSpecified = 0xee;

export type KeyKinds = typeof KindED25519 | typeof KindSECP256K1 | typeof KindSR25519 | typeof KindSECP256R1;

export enum CurveIds {
	SECP256K1 = IdSECP256K1,
	ED25519 = IdED25519,
	SR25519 = IdSR25519,
	SECP256R1 = IdSECP256R1,
}
