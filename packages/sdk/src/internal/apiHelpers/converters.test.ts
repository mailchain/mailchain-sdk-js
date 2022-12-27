import {
	AliceED25519PrivateKey,
	AliceED25519PrivateKeyBytes,
	AliceED25519PublicKey,
} from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, AliceSECP256K1PrivateKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSR25519PublicKey, AliceSR25519PrivateKey } from '@mailchain/crypto/sr25519/test.const';
import { encode } from '@mailchain/encoding';
import { ErrorUnsupportedKey } from '../signatures/errors';
import {
	PrivateKey as ApiPrivateKey,
	PrivateKeyCurveEnum,
	PrivateKeyEncodingEnum,
	PublicKey as ApiPublicKey,
	PublicKeyCurveEnum,
	PublicKeyEncodingEnum,
} from '../api';
import { ApiKeyConvert, CryptoKeyConvert } from '.';

const publicKeyTestCases = [
	{
		name: 'Convert Ed25519 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Ed25519,
			encoding: PublicKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceED25519PublicKey.bytes),
		} as ApiPublicKey,
		cryptoPublicKey: AliceED25519PublicKey,
	},
	{
		name: 'Convert SECP256K1 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Secp256k1,
			encoding: PublicKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceSECP256K1PublicKey.bytes),
		} as ApiPublicKey,
		cryptoPublicKey: AliceSECP256K1PublicKey,
	},
	{
		name: 'Convert Sr25519 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Sr25519,
			encoding: PublicKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceSR25519PublicKey.bytes),
		} as ApiPublicKey,
		cryptoPublicKey: AliceSR25519PublicKey,
	},
] as const;

test.each(publicKeyTestCases)('API->Crypto $name', ({ apiPublicKey, cryptoPublicKey }) => {
	expect(ApiKeyConvert.public(apiPublicKey)).toEqual(cryptoPublicKey);
});

test.each(publicKeyTestCases)('Crypto->API $name', ({ apiPublicKey, cryptoPublicKey }) => {
	expect(CryptoKeyConvert.public(cryptoPublicKey)).toEqual(apiPublicKey);
});

test('public key convert should fail for unsupported curve', () => {
	expect(() => ApiKeyConvert.public({ curve: 'unsupported' as PublicKeyCurveEnum } as ApiPublicKey)).toThrow(
		ErrorUnsupportedKey,
	);
});

const privateKeyTestCases = [
	{
		name: 'Convert Ed25519 Private key',
		apiPrivateKey: {
			curve: PrivateKeyCurveEnum.Ed25519,
			encoding: PrivateKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceED25519PrivateKeyBytes),
		} as ApiPrivateKey,
		cryptoPrivateKey: AliceED25519PrivateKey,
	},
	{
		name: 'Convert SECP256K1 Private key',
		apiPrivateKey: {
			curve: PrivateKeyCurveEnum.Secp256k1,
			encoding: PrivateKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceSECP256K1PrivateKey.bytes),
		} as ApiPublicKey,
		cryptoPrivateKey: AliceSECP256K1PrivateKey,
	},
	{
		name: 'Convert Sr25519 Private key',
		apiPrivateKey: {
			curve: PrivateKeyCurveEnum.Sr25519,
			encoding: PrivateKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceSR25519PrivateKey.bytes),
		} as ApiPublicKey,
		cryptoPrivateKey: AliceSR25519PrivateKey,
	},
] as const;

test.each(privateKeyTestCases)('API->Crypto $name', ({ apiPrivateKey, cryptoPrivateKey }) => {
	expect(ApiKeyConvert.private(apiPrivateKey)).toEqual(cryptoPrivateKey);
});

test.each(privateKeyTestCases)('Crypto->API $name', ({ apiPrivateKey, cryptoPrivateKey }) => {
	expect(CryptoKeyConvert.private(cryptoPrivateKey)).toEqual(apiPrivateKey);
});

test('private key convert should fail for unsupported Sr25519 curve', () => {
	expect(() => ApiKeyConvert.private({ curve: 'unsupported' as PrivateKeyCurveEnum } as ApiPrivateKey)).toThrow(
		ErrorUnsupportedKey,
	);
});
