import { createWalletAddress, ETHEREUM, formatAddress, MAILCHAIN, SOLANA } from '@mailchain/addressing';
import { ED25519PublicKey } from '@mailchain/crypto';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import {
	AliceSECP256K1PublicAddress,
	AliceSECP256K1PublicAddressStr,
	BobSECP256K1PublicAddress,
	BobSECP256K1PublicAddressStr,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import {
	AliceSolanaPublicAddress,
	AliceSolanaPublicAddressStr,
	BobSolanaPublicAddress,
	BobSolanaPublicAddressStr,
} from '@mailchain/addressing/protocols/solana/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { sha256 } from '@noble/hashes/sha256';
import { Configuration } from './configuration';
import { ResolvedAddress, ResolvedAddressItem } from './messagingKeys';
import { MailData } from './transport';

export const dummyMailData: MailData = {
	date: new Date('2022-6-14'),
	id: 'mail-data-id@mailchain.test',
	subject: '💌 Dummy MailData subject 😉',
	from: {
		name: formatAddress({ domain: 'mailchain.test', username: 'alice' }, 'human-friendly'),
		address: formatAddress({ domain: 'mailchain.test', username: 'alice' }, 'mail'),
	},
	recipients: [
		{
			name: formatAddress({ domain: 'mailchain.test', username: 'bob' }, 'human-friendly'),
			address: formatAddress({ domain: 'mailchain.test', username: 'bob' }, 'mail'),
		},
		{
			name: formatAddress(
				createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
				'human-friendly',
			),
			address: formatAddress(
				createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
				'mail',
			),
		},
		{ name: 'tim.eth', address: 'tim@eth.mailchain.test' },
		{
			name: 'Solana Squad',
			address: '8z5rf3d7ExDYE7WjuxBKjPrKH5sbiEzAhEJCw6TkvSUJ@squad.mailchain.test',
		},
	],
	carbonCopyRecipients: [
		{
			name: formatAddress(
				createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
				'human-friendly',
			),
			address: formatAddress(
				createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
				'mail',
			),
		},
		{ name: 'john', address: 'john@mailchain.test' },
	],
	blindCarbonCopyRecipients: [
		{ name: 'jane', address: 'jane@mailchain.test' },
		{ name: 'maria', address: 'maria@mailchain.test' },
	],
	message:
		'<ul>\n\t<li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>\n\t<li>Aliquam tincidunt mauris eu risus.</li>\n\t<li>Vestibulum auctor dapibus neque.</li>\n</ul>',
	plainTextMessage:
		'\t- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.\n\t- Aliquam tincidunt mauris eu risus.\n\t- Vestibulum auctor dapibus neque.',
};

export const dummyMailDataResolvedAddresses: Map<string, ResolvedAddress> = new Map([
	[
		formatAddress({ domain: 'mailchain.test', username: 'alice' }, 'mail'),
		[
			{
				mailchainAddress: formatAddress({ domain: 'mailchain.test', username: 'alice' }, 'mail'),
				messagingKey: aliceKeyRing.accountMessagingKey().publicKey,
				identityKey: aliceKeyRing.accountIdentityKey().publicKey,
				protocol: MAILCHAIN,
			} as ResolvedAddressItem,
		],
	],
	[
		formatAddress({ domain: 'mailchain.test', username: 'bob' }, 'mail'),
		[
			{
				mailchainAddress: formatAddress({ domain: 'mailchain.test', username: 'bob' }, 'mail'),
				messagingKey: bobKeyRing.accountMessagingKey().publicKey,
				identityKey: bobKeyRing.accountIdentityKey().publicKey,
				protocol: MAILCHAIN,
			} as ResolvedAddressItem,
		],
	],
	[
		formatAddress(createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'), 'mail'),
		[
			{
				mailchainAddress: formatAddress(
					createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
					'mail',
				),
				messagingKey: aliceKeyRing.addressBytesMessagingKey(AliceSECP256K1PublicAddress, ETHEREUM, 1).publicKey,
				identityKey: AliceSECP256K1PublicKey,
				protocol: ETHEREUM,
			} as ResolvedAddressItem,
		],
	],
	[
		formatAddress(createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'), 'mail'),
		[
			{
				mailchainAddress: formatAddress(
					createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'),
					'mail',
				),
				messagingKey: bobKeyRing.addressBytesMessagingKey(BobSECP256K1PublicAddress, ETHEREUM, 1).publicKey,
				identityKey: BobSECP256K1PublicKey,
				protocol: ETHEREUM,
			} as ResolvedAddressItem,
		],
	],
	[
		'tim@eth.mailchain.test',
		[
			{
				mailchainAddress: 'tim@eth.mailchain.test',
				messagingKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0x72, 0x7e, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x14,
					]),
				),
				identityKey: new ED25519PublicKey(
					new Uint8Array([
						0xab, 0x3c, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x71,
						0xab, 0x7e, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				protocol: ETHEREUM,
			} as ResolvedAddressItem,
		],
	],
	[
		'john@mailchain.test',
		[
			{
				mailchainAddress: 'john@mailchain.test',
				messagingKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x3c, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				identityKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x7e, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x7e, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				protocol: MAILCHAIN,
			} as ResolvedAddressItem,
		],
	],
	[
		'jane@mailchain.test',
		[
			{
				mailchainAddress: 'jane@mailchain.test',
				messagingKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x7e, 0xaa, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				identityKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0x75, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x7e, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				protocol: MAILCHAIN,
			} as ResolvedAddressItem,
		],
	],
	[
		'maria@mailchain.test',
		[
			{
				mailchainAddress: 'maria@mailchain.test',
				messagingKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0xaa, 0x23, 0xa5, 0xb5, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x7e, 0xaa, 0xa9, 0xdc, 0xb5, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				identityKey: new ED25519PublicKey(
					new Uint8Array([
						0x72, 0x3c, 0x75, 0x23, 0xa5, 0x91, 0x11, 0xaf, 0x5a, 0xd7, 0xb7, 0xef, 0x60, 0x76, 0xe4, 0x14,
						0xab, 0x7e, 0x75, 0xa9, 0xdc, 0x91, 0xe, 0xa6, 0xe, 0x41, 0x7a, 0x2b, 0x77, 0xa, 0x56, 0x71,
					]),
				),
				protocol: MAILCHAIN,
			} as ResolvedAddressItem,
		],
	],
	[
		'8z5rf3d7ExDYE7WjuxBKjPrKH5sbiEzAhEJCw6TkvSUJ@squad.mailchain.test',
		[
			{
				mailchainAddress: `${AliceSolanaPublicAddressStr}@solana.mailchain.com`,
				messagingKey: new ED25519PublicKey(sha256('alice-solana-messaging-key')),
				identityKey: new ED25519PublicKey(AliceSolanaPublicAddress),
				protocol: SOLANA,
			} as ResolvedAddressItem,
			{
				mailchainAddress: `${BobSolanaPublicAddressStr}@solana.mailchain.com`,
				messagingKey: new ED25519PublicKey(sha256('bob-solana-messaging-key')),
				identityKey: new ED25519PublicKey(BobSolanaPublicAddress),
				protocol: SOLANA,
			} as ResolvedAddressItem,
		],
	],
]);

export const dummyMailDataResolvedAddressesWithoutMessagingKey: Map<
	string,
	Pick<ResolvedAddressItem, 'identityKey' | 'protocol'>
> = new Map();
dummyMailDataResolvedAddresses.forEach((addresses) => {
	addresses.forEach((address) => {
		const { identityKey, protocol } = address;
		dummyMailDataResolvedAddressesWithoutMessagingKey.set(address.mailchainAddress, {
			identityKey,
			protocol,
		});
	});
});

export const TestSdkConfig: Configuration = {
	apiPath: 'https://api.mailchain.test',
	mailchainAddressDomain: 'mailchain.test',
	nearRpcUrl: 'http://localhost:3333',
};
