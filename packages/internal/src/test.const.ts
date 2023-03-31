import { createWalletAddress, ETHEREUM, formatAddress, MAILCHAIN } from '@mailchain/addressing';
import { ED25519PublicKey } from '@mailchain/crypto';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import {
	AliceSECP256K1PublicAddress,
	AliceSECP256K1PublicAddressStr,
	BobSECP256K1PublicAddress,
	BobSECP256K1PublicAddressStr,
} from '@mailchain/addressing/protocols/ethereum/test.const';
import { AliceSECP256K1PublicKey, BobSECP256K1PublicKey } from '@mailchain/crypto/secp256k1/test.const';
import { Configuration } from './configuration';
import { ResolvedAddress } from './messagingKeys';
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
		'<ul><li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li><li>Aliquam tincidunt mauris eu risus.</li><li>Vestibulum auctor dapibus neque.</li></ul>',
	plainTextMessage:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Neque vitae tempus quam pellentesque nec nam. Quam nulla porttitor massa id. Nisl rhoncus mattis rhoncus urna. Tortor posuere ac ut consequat semper viverra nam. Facilisis mauris sit amet massa. Et molestie ac feugiat sed lectus vestibulum. Id cursus metus aliquam eleifend mi in nulla posuere sollicitudin. A diam sollicitudin tempor id. Mauris ultrices eros in cursus turpis massa. Elementum facilisis leo vel fringilla est ullamcorper. Aliquam sem et tortor consequat id porta.	',
};

export const dummyMailDataResolvedAddresses: Map<string, ResolvedAddress> = new Map([
	[
		formatAddress({ domain: 'mailchain.test', username: 'alice' }, 'mail'),
		{
			messagingKey: aliceKeyRing.accountMessagingKey().publicKey,
			identityKey: aliceKeyRing.accountIdentityKey().publicKey,
			protocol: MAILCHAIN,
		} as ResolvedAddress,
	],
	[
		formatAddress({ domain: 'mailchain.test', username: 'bob' }, 'mail'),
		{
			messagingKey: bobKeyRing.accountMessagingKey().publicKey,
			identityKey: bobKeyRing.accountIdentityKey().publicKey,
			protocol: MAILCHAIN,
		} as ResolvedAddress,
	],
	[
		formatAddress(createWalletAddress(AliceSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'), 'mail'),
		{
			messagingKey: aliceKeyRing.addressBytesMessagingKey(AliceSECP256K1PublicAddress, ETHEREUM, 1).publicKey,
			identityKey: AliceSECP256K1PublicKey,
			protocol: ETHEREUM,
		} as ResolvedAddress,
	],
	[
		formatAddress(createWalletAddress(BobSECP256K1PublicAddressStr, ETHEREUM, 'mailchain.test'), 'mail'),
		{
			messagingKey: bobKeyRing.addressBytesMessagingKey(BobSECP256K1PublicAddress, ETHEREUM, 1).publicKey,
			identityKey: BobSECP256K1PublicKey,
			protocol: ETHEREUM,
		} as ResolvedAddress,
	],
	[
		'tim@eth.mailchain.test',
		{
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
		} as ResolvedAddress,
	],
	[
		'john@mailchain.test',
		{
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
		} as ResolvedAddress,
	],
	[
		'jane@mailchain.test',
		{
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
		} as ResolvedAddress,
	],
	[
		'maria@mailchain.test',
		{
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
		} as ResolvedAddress,
	],
]);

export const dummyMailDataResolvedAddressesWithoutMessagingKey: Map<
	string,
	Omit<ResolvedAddress, 'messagingKey'>
> = new Map(
	[...dummyMailDataResolvedAddresses].map(([address, result]) => {
		const tmp = { ...result };
		delete (tmp as any).messagingKey;
		return [address, tmp];
	}),
);

export const TestSdkConfig: Configuration = {
	apiPath: 'https://api.mailchain.test',
	mailchainAddressDomain: 'mailchain.test',
	nearRpcUrl: 'http://localhost:3333',
};
