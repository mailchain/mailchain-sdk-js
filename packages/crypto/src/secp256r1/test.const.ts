import { decodeHex } from '@mailchain/encoding';
import { testRandomFunction } from '../rand.test.const';
import { SECP256R1PrivateKey } from './private';
import { SECP256R1PublicKey } from './public';

///Alice
export const AliceSECP256R1PrivateKeyBytes = decodeHex(
	'3cdee0ff28337463455cd1cc43d29b1bf749d9615576525853ccc02b83c8b433',
);
export const AliceSECP256R1PublicKeyBytes = decodeHex(
	'0330ef59d5da4547c684aa0d5b7d8c1527fceab462cfd8d4a3529319c469b0d4d7',
);
export const AliceSECP256R1PrivateKey = new SECP256R1PrivateKey(AliceSECP256R1PrivateKeyBytes, testRandomFunction);
export const AliceSECP256R1PublicKey = new SECP256R1PublicKey(AliceSECP256R1PublicKeyBytes);

///Bob
export const BobSECP256R1PrivateKeyBytes = decodeHex(
	'a1e65c4677435cea57950b39379a9ec7ec0c64edc97efe36cdaae3c386fe2b71',
);
export const BobSECP256R1PublicKeyBytes = decodeHex(
	'032da43f4b992968e53c68c894933e8ba22a7905bf9cdc903fd96d4f38ff49e115',
);
export const BobSECP256R1PrivateKey = new SECP256R1PrivateKey(BobSECP256R1PrivateKeyBytes, testRandomFunction);
export const BobSECP256R1PublicKey = new SECP256R1PublicKey(BobSECP256R1PublicKeyBytes);

///Carlos
export const CarlosSECP256R1PrivateKeyBytes = decodeHex(
	'7198ec54092518b49b2c66468a058f1fdbf0fdf0b1e281a027c692bb0ee1d1ed',
);
export const CarlosSECP256R1PublicKeyBytes = decodeHex(
	'02c48a6a32004a6ec31b78c05c9ea9d6bee0904f7f7a13f384c6f2a25c86fcb0e6',
);
export const CarlosSECP256R1PrivateKey = new SECP256R1PrivateKey(CarlosSECP256R1PrivateKeyBytes, testRandomFunction);
export const CarlosSECP256R1PublicKey = new SECP256R1PublicKey(CarlosSECP256R1PublicKeyBytes);

///Carol
export const CarolSECP256R1PrivateKeyBytes = decodeHex(
	'2aea834aec0efae8418e3bb7f605e37fa5e154a43852afd7875636281dc80de0',
);
export const CarolSECP256R1PublicKeyBytes = decodeHex(
	'0209bf51496bcdf0a90e7e0ccf523ece88eb24f342c8c274cf24b7a31396bdc344',
);
export const CarolSECP256R1PrivateKey = new SECP256R1PrivateKey(CarolSECP256R1PrivateKeyBytes, testRandomFunction);
export const CarolSECP256R1PublicKey = new SECP256R1PublicKey(CarolSECP256R1PublicKeyBytes);
