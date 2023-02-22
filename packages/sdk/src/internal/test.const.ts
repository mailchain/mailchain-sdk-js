import { ETHEREUM, formatAddress, MAILCHAIN } from '@mailchain/addressing';
import { ED25519PublicKey } from '@mailchain/crypto';
import { aliceKeyRing, bobKeyRing } from '@mailchain/keyring/test.const';
import { Configuration } from '../mailchain';
import { ResolvedAddress } from '../messagingKeys';
import { MailData } from '../transport';
import { AliceAccountMailbox, AliceWalletMailbox, BobAccountMailbox, BobWalletMailbox } from './user/test.const';

export const dummyMailData: MailData = {
	date: new Date('2022-6-14'),
	id: 'mail-data-id@mailchain.test',
	subject: '💌 Dummy MailData subject 😉',
	from: {
		name: formatAddress(AliceAccountMailbox.aliases[0].address, 'human-friendly'),
		address: formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
	},
	recipients: [
		{
			name: formatAddress(BobAccountMailbox.aliases[0].address, 'human-friendly'),
			address: formatAddress(BobAccountMailbox.aliases[0].address, 'mail'),
		},
		{
			name: formatAddress(AliceWalletMailbox.aliases[0].address, 'human-friendly'),
			address: formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
		},
		{ name: 'tim.eth', address: 'tim@eth.mailchain.test' },
	],
	carbonCopyRecipients: [
		{
			name: formatAddress(BobWalletMailbox.aliases[0].address, 'human-friendly'),
			address: formatAddress(BobWalletMailbox.aliases[0].address, 'mail'),
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
		formatAddress(AliceAccountMailbox.aliases[0].address, 'mail'),
		{
			messagingKey: aliceKeyRing.accountMessagingKey().publicKey,
			identityKey: AliceAccountMailbox.identityKey,
			protocol: MAILCHAIN,
		},
	],
	[
		formatAddress(BobAccountMailbox.aliases[0].address, 'mail'),
		{
			messagingKey: bobKeyRing.accountMessagingKey().publicKey,
			identityKey: bobKeyRing.accountIdentityKey().publicKey,
			protocol: MAILCHAIN,
		},
	],
	[
		formatAddress(AliceWalletMailbox.aliases[0].address, 'mail'),
		{
			messagingKey: aliceKeyRing.addressMessagingKey(
				AliceWalletMailbox.messagingKeyParams.address,
				AliceWalletMailbox.messagingKeyParams.protocol,
				AliceWalletMailbox.messagingKeyParams.nonce,
			).publicKey,
			identityKey: AliceWalletMailbox.identityKey,
			protocol: AliceWalletMailbox.messagingKeyParams.protocol,
		},
	],
	[
		formatAddress(BobWalletMailbox.aliases[0].address, 'mail'),
		{
			messagingKey: bobKeyRing.addressMessagingKey(
				BobWalletMailbox.messagingKeyParams.address,
				BobWalletMailbox.messagingKeyParams.protocol,
				BobWalletMailbox.messagingKeyParams.nonce,
			).publicKey,
			identityKey: BobWalletMailbox.identityKey,
			protocol: BobWalletMailbox.messagingKeyParams.protocol,
		},
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
		},
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
		},
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
		},
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
		},
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
};
