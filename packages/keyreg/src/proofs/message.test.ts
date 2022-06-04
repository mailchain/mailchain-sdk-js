import { PublicKey } from '@mailchain/crypto/public';
import { EncodingType, EncodingTypes } from '@mailchain/encoding';
import { AliceED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { CreateProofMessage } from './message';
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
			expected:
				'Welcome to Mailchain!\n\nSign to start using this address for messaging.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nAddress: 0x5602ea95540bee46d03ba335eed6f49d117eab95c8ab8b71bae2cdd1e564a761\nMessaging key: 0xe2723caa23a5b511af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671\nNonce: 1',
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
			expected: '',
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
			expected: '',
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
			expected: '',
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
			expected: '',
			shouldThrow: true,
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			if (test.shouldThrow) {
				expect(() => {
					CreateProofMessage(test.args.params, test.args.address, test.args.publicKey, test.args.nonce);
				}).toThrow();
			} else {
				expect(
					CreateProofMessage(test.args.params, test.args.address, test.args.publicKey, test.args.nonce),
				).toEqual(test.expected);
			}
		});
	});
});
