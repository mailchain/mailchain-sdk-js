import { PublicKey } from '@mailchain/crypto/public';
import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { createProofMessage } from './message';
import { ProofParams } from './params';

describe('CreateProofMessage', () => {
	const tests = [
		{
			name: 'simple-v1-en_US',
			args: {
				params: {
					AddressEncoding: EncodingTypes.Hex0xPrefix,
					PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
					Locale: 'en_US',
					Variant: 'simple-v1',
				} as ProofParams,
				address: Buffer.from('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'hex'),
				publicKey: AliceED25519PublicKey,
				nonce: 1,
			},
			shouldThrow: false,
		},
		{
			name: 'template-not-found',
			args: {
				params: {
					AddressEncoding: EncodingTypes.Hex0xPrefix,
					PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
					Locale: 'en_US',
					Variant: 'unknown',
				} as ProofParams,
				address: Buffer.from('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'hex'),
				publicKey: AliceED25519PublicKey,
				nonce: 1,
			},
			shouldThrow: true,
		},
		{
			name: 'invalid-address-encoding',
			args: {
				params: {
					AddressEncoding: 'invalid' as EncodingType,
					PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
					Locale: 'en_US',
					Variant: 'simple-v1',
				} as ProofParams,
				address: Buffer.from('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'hex'),
				publicKey: AliceED25519PublicKey,
				nonce: 1,
			},
			shouldThrow: true,
		},
		{
			name: 'invalid-public-key-encoding',
			args: {
				params: {
					AddressEncoding: EncodingTypes.Hex0xPrefix,
					PublicKeyEncoding: 'invalid' as EncodingType,
					Locale: 'en_US',
					Variant: 'simple-v1',
				} as ProofParams,
				address: Buffer.from('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'hex'),
				publicKey: AliceED25519PublicKey,
				nonce: 1,
			},
			shouldThrow: true,
		},
		{
			name: 'err-public-key',
			args: {
				params: {
					AddressEncoding: EncodingTypes.Hex0xPrefix,
					PublicKeyEncoding: EncodingTypes.Hex0xPrefix,
					Locale: 'en_US',
					Variant: 'simple-v1',
				} as ProofParams,
				address: Buffer.from('5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761', 'hex'),
				publicKey: {} as PublicKey,
				nonce: 1,
			},
			shouldThrow: true,
		},
	];
	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				createProofMessage(test.args.params, test.args.address, test.args.publicKey, test.args.nonce);
			}).toThrow();
		} else {
			expect(
				createProofMessage(test.args.params, test.args.address, test.args.publicKey, test.args.nonce),
			).toMatchSnapshot(test.name);
		}
	});
});
