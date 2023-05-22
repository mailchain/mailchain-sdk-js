import { SECP256K1PrivateKey } from '@mailchain/crypto';
import { decodeHex } from '@mailchain/encoding';

// Alice
export const AliceFilStr = 'f410faiikgixcdd7alrsbpunjlen4etkcarbfbghn7wi';
export const AliceFilEthAddressStr = '0x0210a322e218fe05c6417d1a9591bc24d4204425';
export const AliceFilEthPrivateKeyStr = '6c115551accbd74b46401a531af1dd0890034c18137dddab52a53c626e75b051';
export const AliceFilEthPrivateKey = new SECP256K1PrivateKey(decodeHex(AliceFilEthPrivateKeyStr));

// Bob
export const BobFilAddressStr = 'f410f5blfdi7tmto6o2aa2up4vwtdm7qcnaiqpeazuwy';
export const BobFilEthAddressStr = '0xe85651a3f364dde76800d51fcada6367e0268110';
export const BobFilEthPrivateKeyStr = '2c6b29d5545e5804b7fb7e65404782e57dddea84cbcec9b2586add6403808965';
export const BobFilEthPrivateKey = new SECP256K1PrivateKey(decodeHex(BobFilEthPrivateKeyStr));

export enum FilPrefix {
	F4ETHEREUM = 'f410',
	T4ETHEREUM = 't410',
}
