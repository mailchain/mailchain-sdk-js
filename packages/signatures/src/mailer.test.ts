import {
	AliceED25519PublicKey,
	BobED25519PublicKey,
	AliceED25519PrivateKey,
	BobED25519PrivateKey,
} from '@mailchain/crypto/ed25519/test.const';
import { AliceSECP256K1PublicKey, AliceSECP256K1PrivateKey } from '@mailchain/crypto/secp256k1/test.const';
import { ErrorUnsupportedKey } from '@mailchain/crypto';
import {
	createMailerProof,
	MailerProof,
	MailerProofParams,
	createMailerProofSigningData,
	verifyMailerProof,
} from './mailer';

const aliceMailerProof = {
	params: {
		authorContentSignature: Uint8Array.from([5, 6, 7, 8]),
		expires: new Date('2022-06-06'),
		mailerMessagingKey: BobED25519PublicKey,
	},
	signature: Uint8Array.from([
		1, 248, 81, 21, 91, 149, 47, 249, 46, 65, 40, 134, 3, 190, 218, 174, 82, 137, 251, 192, 231, 8, 229, 28, 105,
		119, 220, 38, 241, 57, 43, 202, 229, 218, 65, 246, 184, 235, 119, 36, 52, 5, 229, 247, 60, 101, 184, 217, 43,
		51, 117, 30, 197, 222, 236, 96, 253, 166, 217, 198, 241, 7, 242, 15,
	]),
	version: '1.0',
} as MailerProof;

const bobMailerProof = {
	params: {
		authorContentSignature: Uint8Array.from([5, 6, 7, 8]),
		expires: new Date('2022-06-06'),
		mailerMessagingKey: AliceED25519PublicKey,
	},
	signature: Uint8Array.from([
		255, 187, 63, 176, 181, 113, 75, 167, 184, 98, 33, 229, 194, 55, 116, 79, 39, 244, 40, 197, 105, 70, 235, 45,
		251, 228, 131, 215, 187, 15, 101, 59, 197, 153, 209, 177, 37, 180, 218, 37, 57, 209, 48, 186, 121, 117, 248, 97,
		12, 46, 41, 99, 68, 35, 7, 67, 124, 63, 81, 225, 77, 45, 13, 13,
	]),
	version: '1.0',
} as MailerProof;
describe('createMailerProofParamsForSigning()', () => {
	const tests = [
		{
			name: `version-1.0`,
			data: {
				authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
				expires: new Date('2022-06-06'),
				mailerMessagingKey: BobED25519PublicKey,
			} as MailerProofParams,
			version: '1.0',
		},
	];
	test.each(tests)('$name', (test) => {
		const actual = createMailerProofSigningData(test.data, test.version);
		expect(actual).toMatchSnapshot();
	});
});

describe('verifyMailerProof()', () => {
	const tests = [
		{
			name: `valid-sig-ed25519-alice`,
			args: {
				key: AliceED25519PublicKey,
				mailerProof: aliceMailerProof,
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `valid-sig-ed25519-bob`,
			args: {
				key: BobED25519PublicKey,
				mailerProof: bobMailerProof,
			},
			expected: true,
			shouldThrow: false,
		},
		{
			name: `incorrect-sig-ed25519-alice`,
			args: {
				key: AliceED25519PublicKey,
				mailerProof: {
					...aliceMailerProof,
					signature: new Uint8Array([
						0x50, 0x2a, 0x4d, 0x32, 0x20, 0x94, 0x45, 0xda, 0xaf, 0x82, 0xc2, 0xfd, 0x73, 0xa9, 0x83, 0xeb,
						0xd, 0xfb, 0x45, 0x92, 0x9b, 0x90, 0x46, 0xbb, 0x7c, 0x1d, 0xcd, 0x6d, 0xa7, 0x87, 0x8d, 0x6f,
						0x4c, 0x45, 0x53, 0xd9, 0x2, 0xf8, 0xa6, 0x12, 0xae, 0x6f, 0x46, 0xd3, 0x4f, 0x75, 0x59, 0x30,
						0xa8, 0xd1, 0xaa, 0xcb, 0xd, 0xf0, 0x5, 0xff, 0xc1, 0xb4, 0x7e, 0xe7, 0xe8, 0x3d, 0x4f, 0xc,
					]),
				},
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `incorrect-sig-ed25519-bob`,
			args: {
				key: BobED25519PublicKey,
				mailerProof: {
					...bobMailerProof,
					signature: new Uint8Array([
						0xfe, 0xac, 0xe1, 0x62, 0xd7, 0x82, 0xae, 0xd, 0xff, 0x85, 0x9f, 0xe2, 0xc, 0x2a, 0xdd, 0xbe,
						0xf5, 0xbf, 0x3c, 0xd4, 0x8f, 0x49, 0x5c, 0x45, 0x97, 0x7f, 0x87, 0x4f, 0xf5, 0xcf, 0x50, 0x67,
						0xac, 0x20, 0x88, 0xf9, 0xc, 0x62, 0x68, 0xb9, 0xcf, 0x51, 0x7c, 0x51, 0xc4, 0x93, 0xae, 0xdb,
						0x5b, 0x10, 0xfd, 0x53, 0x64, 0x90, 0x87, 0x83, 0x9f, 0x87, 0xe8, 0x8a, 0x32, 0x38, 0x84, 0xd,
					]),
				},
			},
			expected: false,
			shouldThrow: false,
		},
		{
			name: `unsupported-key`,
			args: {
				key: AliceSECP256K1PublicKey,
				mailerProof: aliceMailerProof,
			},
			expected: false,
			shouldThrow: new ErrorUnsupportedKey('secp256k1'),
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = verifyMailerProof(test.args.key, test.args.mailerProof);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.catch((e) => expect(e).toEqual(test.shouldThrow));
		}
		return target.then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});

describe('createMailerProof()', () => {
	const tests = [
		{
			name: `ed25519-alice`,
			args: {
				key: AliceED25519PrivateKey,
				message: {
					expires: new Date('2022-06-06'),
					mailerMessagingKey: BobED25519PublicKey,
					authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
				} as MailerProofParams,
				version: '1.0',
			},
			expected: aliceMailerProof,
			shouldThrow: false,
		},
		{
			name: `ed25519-bob`,
			args: {
				key: BobED25519PrivateKey,
				message: {
					authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
					expires: new Date('2022-06-06'),
					mailerMessagingKey: AliceED25519PublicKey,
				} as MailerProofParams,
				version: '1.0',
			},
			expected: bobMailerProof,
			shouldThrow: false,
		},
		{
			name: `unsupported-key`,
			args: {
				key: AliceSECP256K1PrivateKey,
				message: {
					authorContentSignature: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
					expires: new Date('2022-06-06'),
					mailerMessagingKey: BobED25519PublicKey,
				} as MailerProofParams,
				version: '1.0',
			},
			expected: null,
			shouldThrow: new ErrorUnsupportedKey('secp256k1'),
		},
	];
	test.each(tests)('$name', async (test) => {
		const target = createMailerProof(test.args.key, test.args.message, test.args.version);
		if (test.shouldThrow) {
			expect.assertions(1);
			return target.catch((e) => expect(e).toEqual(test.shouldThrow));
		}
		return target.then((actual) => {
			expect(actual).toEqual(test.expected);
		});
	});
});
