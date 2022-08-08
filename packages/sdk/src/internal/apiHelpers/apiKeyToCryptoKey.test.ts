import { AliceED25519PrivateKey, AliceED25519PublicKey, AliceED25519Seed } from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, AliceSECP256K1PrivateKey } from '@mailchain/crypto/secp256k1/test.const';
import { AliceSR25519PublicKey, AliceSR25519PrivateKey } from '@mailchain/crypto/sr25519/test.const';
import { ErrorUnsupportedKey } from '@mailchain/crypto/signatures/errors';

import { encode } from '@mailchain/encoding/encoding';
import {
	PrivateKey as ApiPrivateKey,
	PrivateKeyCurveEnum,
	PrivateKeyEncodingEnum,
	PublicKey as ApiPublicKey,
	PublicKeyCurveEnum,
	PublicKeyEncodingEnum,
} from '../api';
import { ApiKeyConvert } from '.';

const publicKeyTestCases = [
	{
		name: 'Convert Ed25519 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Ed25519,
			encoding: PublicKeyEncodingEnum._0xPrefix,
			value: encode('hex/0x-prefix', AliceED25519PublicKey.bytes),
		} as ApiPublicKey,
		resultPublicKey: AliceED25519PublicKey,
	},
	{
		name: 'Convert SECP256K1 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Secp256k1,
			encoding: PublicKeyEncodingEnum.Plain,
			value: encode('hex/plain', AliceSECP256K1PublicKey.bytes),
		} as ApiPublicKey,
		resultPublicKey: AliceSECP256K1PublicKey,
	},
	{
		name: 'Convert Sr25519 Public key',
		apiPublicKey: {
			curve: PublicKeyCurveEnum.Sr25519,
			encoding: PublicKeyEncodingEnum.Plain,
			value: encode('hex/plain', AliceSR25519PublicKey.bytes),
		} as ApiPublicKey,
		resultPublicKey: AliceSR25519PublicKey,
	},
] as const;

test.each(publicKeyTestCases)('$name', ({ apiPublicKey, resultPublicKey }) => {
	expect(ApiKeyConvert.public(apiPublicKey)).toEqual(resultPublicKey);
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
			encoding: PrivateKeyEncodingEnum.Plain,
			value: encode('hex/plain', AliceED25519Seed),
		} as ApiPrivateKey,
		resultPrivateKey: AliceED25519PrivateKey,
	},
	{
		name: 'Convert SECP256K1 Private key',
		apiPrivateKey: {
			curve: PrivateKeyCurveEnum.Secp256k1,
			encoding: PrivateKeyEncodingEnum.Plain,
			value: encode('hex/plain', AliceSECP256K1PrivateKey.bytes),
		} as ApiPublicKey,
		resultPrivateKey: AliceSECP256K1PrivateKey,
	},
	{
		name: 'Convert Sr25519 Private key',
		apiPrivateKey: {
			curve: PrivateKeyCurveEnum.Sr25519,
			encoding: PrivateKeyEncodingEnum.Plain,
			value: encode('hex/plain', AliceSR25519PrivateKey.bytes),
		} as ApiPublicKey,
		resultPrivateKey: AliceSR25519PrivateKey,
	},
] as const;

test.each(privateKeyTestCases)('$name', ({ apiPrivateKey, resultPrivateKey }) => {
	expect(ApiKeyConvert.private(apiPrivateKey)).toEqual(resultPrivateKey);
});

test('private key convert should fail for unsupported Sr25519 curve', () => {
	expect(() => ApiKeyConvert.private({ curve: 'unsupported' as PrivateKeyCurveEnum } as ApiPrivateKey)).toThrow(
		ErrorUnsupportedKey,
	);
});
