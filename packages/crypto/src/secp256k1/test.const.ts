import { SECP256K1PublicKey, SECP256K1PrivateKey } from './';

// Public
export const BobHexSECP256K1PublicKey =
	'04bdf6fb97c97c126b492186a4d5b28f34f0671a5aacc974da3bde0be93e45a1c50f89ceff72bd04ac9e25a04a1a6cb010aedaf65f91cec8ebe75901c49b63355d';
export const BobUncompressedSECP256K1PublicKeyBytes = Uint8Array.from(Buffer.from(BobHexSECP256K1PublicKey, 'hex'));
export const BobCompressedSECP256K1PublicKeyBytes = new Uint8Array([
	3, 189, 246, 251, 151, 201, 124, 18, 107, 73, 33, 134, 164, 213, 178, 143, 52, 240, 103, 26, 90, 172, 201, 116, 218,
	59, 222, 11, 233, 62, 69, 161, 197,
]);
export const BobSECP256K1PublicKey = new SECP256K1PublicKey(BobCompressedSECP256K1PublicKeyBytes);

export const AliceHexSECP256K1PublicKey =
	'0469d908510e355beb1d5bf2df8129e5b6401e1969891e8016a0b2300739bbb00687055e5924a2fd8dd35f069dc14d8147aa11c1f7e2f271573487e1beeb2be9d0';
export const AliceUncompressedSECP256K1PublicKeyBytes = Uint8Array.from(Buffer.from(AliceHexSECP256K1PublicKey, 'hex'));
export const AliceCompressedSECP256K1PublicKeyBytes = new Uint8Array([
	2, 105, 217, 8, 81, 14, 53, 91, 235, 29, 91, 242, 223, 129, 41, 229, 182, 64, 30, 25, 105, 137, 30, 128, 22, 160,
	178, 48, 7, 57, 187, 176, 6,
]);
export const AliceSECP256K1PublicKey = new SECP256K1PublicKey(AliceCompressedSECP256K1PublicKeyBytes);

// Private
export const BobHexSECP256K1PrivateKey = 'DF4BA9F6106AD2846472F759476535E55C5805D8337DF5A11C3B139F438B98B3';
export const BobSECP256K1PrivateKeyBytes = Uint8Array.from(Buffer.from(BobHexSECP256K1PrivateKey, 'hex'));
export const BobSECP256K1PrivateKey = new SECP256K1PrivateKey(BobSECP256K1PrivateKeyBytes);

export const AliceSECP256K1HexPrivateKey = '01901E63389EF02EAA7C5782E08B40D98FAEF835F28BD144EECF5614A415943F';
export const AliceSECP256K1PrivateKeyBytes = Uint8Array.from(Buffer.from(AliceSECP256K1HexPrivateKey, 'hex'));
export const AliceSECP256K1PrivateKey = new SECP256K1PrivateKey(AliceSECP256K1PrivateKeyBytes);
