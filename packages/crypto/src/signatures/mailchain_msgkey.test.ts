import { EncodeHexZeroX } from '@mailchain/encoding/hex';
import { protocols } from '@mailchain/internal';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '../secp256k1/test.const';
import { AliceED25519PublicKey, BobED25519PublicKey } from '../ed25519/test.const';
import { ED25519PrivateKey } from '../ed25519';
import { EthereumAlice, EthereumBob } from '../../../internal/src/addressing/test.constants';
import {
	mailchainProvidedMessagingKeyMessage,
	SignMailchainProvidedMessagingKey,
	VerifyMailchainProvidedMessagingKey,
} from './mailchain_msgkey';
import { ErrorUnsupportedKey } from './errors';

describe('TestSignMailchainProvidedMessagingKey()', () => {
	const key = ED25519PrivateKey.fromSeed(
		new Uint8Array(Buffer.from('master-key-rand-func-0123456789-0123456789', 'utf-8').slice(0, 32)),
	);

	const tests = [
		{
			name: `alice-ed25519`,
			args: {
				msgKey: AliceED25519PublicKey,
				key,
				address: EncodeHexZeroX(EthereumAlice),
				protocol: 'ethereum',
			},
			expected: new Uint8Array([
				0x73, 0xa5, 0xfd, 0x94, 0x72, 0xcd, 0xe7, 0x55, 0xc8, 0x95, 0x65, 0xad, 0xa0, 0x10, 0xaa, 0xa, 0xe,
				0x48, 0x34, 0xea, 0x29, 0x2, 0x29, 0x4e, 0xa4, 0x3, 0xc, 0x74, 0xe6, 0xe7, 0xb7, 0xb9, 0xa8, 0xff, 0x94,
				0x3f, 0x2e, 0xb4, 0x1d, 0x7e, 0xce, 0xc, 0x9d, 0xa5, 0x66, 0x46, 0xd7, 0x18, 0xee, 0xe2, 0x46, 0xb6,
				0x13, 0x14, 0xb0, 0x18, 0x20, 0x51, 0xca, 0xca, 0xe0, 0x9e, 0xe0, 0xe,
			]),
			shouldThrow: false,
		},
		{
			name: `alice-ed25519`,
			args: {
				msgKey: BobED25519PublicKey,
				key,
				address: EncodeHexZeroX(EthereumBob),
				protocol: 'ethereum',
			},
			expected: new Uint8Array([
				0xfe, 0x84, 0x20, 0x16, 0x7, 0x8a, 0x7b, 0xd1, 0x4, 0x2c, 0x96, 0xd5, 0x87, 0xde, 0xc5, 0x75, 0x69,
				0x58, 0xd5, 0x18, 0xb8, 0x79, 0xa3, 0x8c, 0xdf, 0x78, 0xdc, 0x96, 0xe, 0xfd, 0xb3, 0x3f, 0x67, 0xd2,
				0xa9, 0xcf, 0xc0, 0x26, 0x13, 0xf5, 0xa0, 0x4a, 0xc6, 0x14, 0x32, 0x5d, 0xf2, 0x39, 0xaf, 0x11, 0x26,
				0x16, 0x2a, 0x73, 0xb3, 0x9f, 0xf, 0xbd, 0x4c, 0xb3, 0x3c, 0x3a, 0x27, 0x9,
			]),
			shouldThrow: false,
		},
		{
			name: 'err-invalid-messaging-key-secp256k1',
			args: {
				msgKey: BobSECP256K1PublicKey,
				key: ED25519PrivateKey.generate(),
				address: EncodeHexZeroX(EthereumBob),
				protocol: 'ethereum',
			},
			expected: new Uint8Array([
				0xfe, 0x84, 0x20, 0x16, 0x7, 0x8a, 0x7b, 0xd1, 0x4, 0x2c, 0x96, 0xd5, 0x87, 0xde, 0xc5, 0x75, 0x69,
				0x58, 0xd5, 0x18, 0xb8, 0x79, 0xa3, 0x8c, 0xdf, 0x78, 0xdc, 0x96, 0xe, 0xfd, 0xb3, 0x3f, 0x67, 0xd2,
				0xa9, 0xcf, 0xc0, 0x26, 0x13, 0xf5, 0xa0, 0x4a, 0xc6, 0x14, 0x32, 0x5d, 0xf2, 0x39, 0xaf, 0x11, 0x26,
				0x16, 0x2a, 0x73, 0xb3, 0x9f, 0xf, 0xbd, 0x4c, 0xb3, 0x3c, 0x3a, 0x27, 0x9,
			]),
			shouldThrow: true,
		},
	];

	test.each(tests)('$name', async (test) => {
		try {
			await SignMailchainProvidedMessagingKey(
				test.args.key,
				test.args.msgKey,
				test.args.address,
				test.args.protocol as protocols.ProtocolType,
			);
			if (test.shouldThrow) fail(`Test ${test.name} should fail`);
		} catch (e) {
			if (test.shouldThrow) expect(e).toBeDefined();
			else fail(`Test ${test.name} should not fail`);
		}
	});
});

describe('TestVerifyMailchainProvidedMessagingKey()', () => {
	const key = ED25519PrivateKey.fromSeed(
		new Uint8Array(Buffer.from('master-key-rand-func-0123456789-0123456789', 'utf-8').slice(0, 32)),
	);

	const tests = [
		{
			name: `alice-ed25519`,
			args: {
				msgKey: AliceED25519PublicKey,
				key: key.publicKey,
				address: EncodeHexZeroX(EthereumAlice),
				protocol: 'ethereum',
				signature: new Uint8Array([
					0x73, 0xa5, 0xfd, 0x94, 0x72, 0xcd, 0xe7, 0x55, 0xc8, 0x95, 0x65, 0xad, 0xa0, 0x10, 0xaa, 0xa, 0xe,
					0x48, 0x34, 0xea, 0x29, 0x2, 0x29, 0x4e, 0xa4, 0x3, 0xc, 0x74, 0xe6, 0xe7, 0xb7, 0xb9, 0xa8, 0xff,
					0x94, 0x3f, 0x2e, 0xb4, 0x1d, 0x7e, 0xce, 0xc, 0x9d, 0xa5, 0x66, 0x46, 0xd7, 0x18, 0xee, 0xe2, 0x46,
					0xb6, 0x13, 0x14, 0xb0, 0x18, 0x20, 0x51, 0xca, 0xca, 0xe0, 0x9e, 0xe0, 0xe,
				]),
			},
			expected: true,

			shouldThrow: false,
		},
		{
			name: `bob-ed25519`,
			args: {
				msgKey: BobED25519PublicKey,
				key: key.publicKey,
				address: EncodeHexZeroX(EthereumBob),
				protocol: 'ethereum',
				signature: new Uint8Array([
					0xfe, 0x84, 0x20, 0x16, 0x7, 0x8a, 0x7b, 0xd1, 0x4, 0x2c, 0x96, 0xd5, 0x87, 0xde, 0xc5, 0x75, 0x69,
					0x58, 0xd5, 0x18, 0xb8, 0x79, 0xa3, 0x8c, 0xdf, 0x78, 0xdc, 0x96, 0xe, 0xfd, 0xb3, 0x3f, 0x67, 0xd2,
					0xa9, 0xcf, 0xc0, 0x26, 0x13, 0xf5, 0xa0, 0x4a, 0xc6, 0x14, 0x32, 0x5d, 0xf2, 0x39, 0xaf, 0x11,
					0x26, 0x16, 0x2a, 0x73, 0xb3, 0x9f, 0xf, 0xbd, 0x4c, 0xb3, 0x3c, 0x3a, 0x27, 0x9,
				]),
			},
			expected: true,

			shouldThrow: false,
		},
		{
			name: `err-alice-secp256k1`,
			args: {
				msgKey: BobSECP256K1PublicKey,
				key: AliceSECP256K1PublicKey,
				address: EncodeHexZeroX(EthereumBob),
				protocol: 'ethereum',
				signature: new Uint8Array([
					0xfe, 0x84, 0x20, 0x16, 0x7, 0x8a, 0x7b, 0xd1, 0x4, 0x2c, 0x96, 0xd5, 0x87, 0xde, 0xc5, 0x75, 0x69,
					0x58, 0xd5, 0x18, 0xb8, 0x79, 0xa3, 0x8c, 0xdf, 0x78, 0xdc, 0x96, 0xe, 0xfd, 0xb3, 0x3f, 0x67, 0xd2,
					0xa9, 0xcf, 0xc0, 0x26, 0x13, 0xf5, 0xa0, 0x4a, 0xc6, 0x14, 0x32, 0x5d, 0xf2, 0x39, 0xaf, 0x11,
					0x26, 0x16, 0x2a, 0x73, 0xb3, 0x9f, 0xf, 0xbd, 0x4c, 0xb3, 0x3c, 0x3a, 0x27, 0x9,
				]),
			},
			expected: true,

			shouldThrow: true,
		},
		{
			name: `err-invalid-master-key-secp256k1`,
			args: {
				msgKey: BobED25519PublicKey,
				key: BobSECP256K1PublicKey,
				address: EncodeHexZeroX(EthereumBob),
				protocol: 'ethereum',
				signature: new Uint8Array([
					0xfe, 0x84, 0x20, 0x16, 0x7, 0x8a, 0x7b, 0xd1, 0x4, 0x2c, 0x96, 0xd5, 0x87, 0xde, 0xc5, 0x75, 0x69,
					0x58, 0xd5, 0x18, 0xb8, 0x79, 0xa3, 0x8c, 0xdf, 0x78, 0xdc, 0x96, 0xe, 0xfd, 0xb3, 0x3f, 0x67, 0xd2,
					0xa9, 0xcf, 0xc0, 0x26, 0x13, 0xf5, 0xa0, 0x4a, 0xc6, 0x14, 0x32, 0x5d, 0xf2, 0x39, 0xaf, 0x11,
					0x26, 0x16, 0x2a, 0x73, 0xb3, 0x9f, 0xf, 0xbd, 0x4c, 0xb3, 0x3c, 0x3a, 0x27, 0x9,
				]),
			},
			expected: true,
			shouldThrow: true,
		},
	];

	test.each(tests)('$name', async (test) => {
		try {
			await VerifyMailchainProvidedMessagingKey(
				test.args.key,
				test.args.msgKey,
				test.args.signature,
				test.args.address,
				test.args.protocol as protocols.ProtocolType,
			);
			if (test.shouldThrow) fail(`Test ${test.name} should fail`);
		} catch (e) {
			if (test.shouldThrow) expect(e).toBeDefined();
			else fail(`Test ${test.name} should not fail`);
		}
	});
});

describe('Test_mailchainProvidedMessagingKeyMessage()', () => {
	const tests = [
		{
			name: `alice-ethereum`,
			args: {
				msgKey: AliceED25519PublicKey,
				address: EncodeHexZeroX(EthereumAlice),
				protocol: 'ethereum',
			},
			expected: new Uint8Array(
				Buffer.from(
					'\x11Mailchain provided messaging key:\nAddress:0xd5ab4ce3605cd590db609b6b5c8901fdb2ef7fe6\nProtocol:ethereum\nKey:0xe2723caa23a5b511af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671',
				),
			),
			shouldThrow: false,
		},
	];

	test.each(tests)('$name', async (test) => {
		if (test.shouldThrow) {
			expect(() => {
				mailchainProvidedMessagingKeyMessage(
					test.args.msgKey,
					test.args.address,
					test.args.protocol as protocols.ProtocolType,
				);
			}).rejects.toThrow(new ErrorUnsupportedKey(test.args.msgKey.curve));
		} else {
			expect(
				mailchainProvidedMessagingKeyMessage(
					test.args.msgKey,
					test.args.address,
					test.args.protocol as protocols.ProtocolType,
				),
			).toEqual(test.expected);
		}
	});
});
