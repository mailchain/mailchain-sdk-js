import { getRandomValues } from './getRandomValues';

if (typeof global !== 'undefined' && typeof globalThis.crypto === 'undefined') {
	globalThis.crypto = { ...require('crypto').webcrypto, getRandomValues };
}

export { ED25519ExtendedPrivateKey, ED25519PrivateKey, ED25519PublicKey, deriveHardenedKey } from './ed25519';
export { SECP256K1PrivateKey, SECP256K1PublicKey } from './secp256k1';
export { SR25519ExtendedPrivateKey, SR25519PrivateKey, SR25519PublicKey, sr25519DeriveHardenedKey } from './sr25519';
export * from './keys';
export * from './multikey';
export * from './public';
export * from './private';
export * from './rand';
export * from './hd';
export * from './cipher';
