import { ALGORAND, ETHEREUM, MAILCHAIN, SUBSTRATE } from './protocols';
import { formatAddress } from './addressFormatting';
import { createNameServiceAddress, createWalletAddress, MailchainAddress } from '.';

const testCases: { address: MailchainAddress; expectedMail: string; expectedHuman: string }[] = [
	{
		address: createWalletAddress('0x492d61cD88255EbC8556c6393AFA3f3ac2B0505E', ETHEREUM, 'mailchain.local'),
		expectedMail: '0x492d61cd88255ebc8556c6393afa3f3ac2b0505e@ethereum.mailchain.local',
		expectedHuman: '0x492d...505e@ethereum',
	},
	{
		address: createWalletAddress(
			'bgdmm4kdvwlg7jlzzentbrt7sxtuxthdyxwlsxewx62yfb3fmtsjycb7dq',
			ALGORAND,
			'mailchain.com',
		),
		expectedMail: 'bgdmm4kdvwlg7jlzzentbrt7sxtuxthdyxwlsxewx62yfb3fmtsjycb7dq@algorand.mailchain.com',
		expectedHuman: 'bgdm...b7dq@algorand',
	},
	{
		address: createWalletAddress('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', SUBSTRATE, 'mailchain.dev'),
		expectedMail: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY@substrate.mailchain.dev',
		expectedHuman: '5Grw...utQY@substrate',
	},
	{
		address: createNameServiceAddress('account', 'mailchain.xyz'),
		expectedMail: 'account@mailchain.xyz',
		expectedHuman: 'account@mailchain',
	},
	{
		address: createNameServiceAddress('alice.eth', 'ens.mailchain.test'),
		expectedMail: 'alice.eth@ens.mailchain.test',
		expectedHuman: 'alice.eth',
	},
	{
		address: createNameServiceAddress('alice.eth', 'ens.ethereum.mailchain.test'),
		expectedMail: 'alice.eth@ens.ethereum.mailchain.test',
		expectedHuman: 'alice.eth',
	},
	{
		address: createNameServiceAddress('billing.alice.eth', 'ens.mailchain.test'),
		expectedMail: 'billing.alice.eth@ens.mailchain.test',
		expectedHuman: 'billing.alice.eth',
	},
	{
		address: createNameServiceAddress('alice.crypto', 'unstoppable.mailchain.test'),
		expectedMail: 'alice.crypto@unstoppable.mailchain.test',
		expectedHuman: 'alice.crypto',
	},
	{
		address: createNameServiceAddress('alice.bitcoin', 'unstoppable.mailchain.test'),
		expectedMail: 'alice.bitcoin@unstoppable.mailchain.test',
		expectedHuman: 'alice.bitcoin@unstoppable',
	},
	{
		address: createNameServiceAddress('alice.bitcoin', 'unstoppable.ethereum.mailchain.test'),
		expectedMail: 'alice.bitcoin@unstoppable.ethereum.mailchain.test',
		expectedHuman: 'alice.bitcoin@unstoppable.ethereum',
	},
	{
		address: createNameServiceAddress(
			'244a6b069451faf6f4296284dcb75ccb14ef686699f54a7d3f790a6d50471e06',
			'near.mailchain.test',
		),
		expectedMail: '244a6b069451faf6f4296284dcb75ccb14ef686699f54a7d3f790a6d50471e06@near.mailchain.test',
		expectedHuman: '244a6b...1e06@near',
	},
	{
		address: createNameServiceAddress(
			'98793cd91a3f870fb126f66285808c7e094afcfc4eda8a970f6648cdf0dbd6de.testnet',
			'near.mailchain.test',
		),
		expectedMail: '98793cd91a3f870fb126f66285808c7e094afcfc4eda8a970f6648cdf0dbd6de.testnet@near.mailchain.test',
		expectedHuman: '98793c...d6de@near',
	},
	{
		address: createNameServiceAddress('alice.near', 'near.mailchain.test'),
		expectedMail: 'alice.near@near.mailchain.test',
		expectedHuman: 'alice.near',
	},
	{
		address: createNameServiceAddress('alice.testnet', 'near.mailchain.test'),
		expectedMail: 'alice.testnet@near.mailchain.test',
		expectedHuman: 'alice.testnet@near',
	},
	{
		address: createNameServiceAddress('alice.aurora', 'near.mailchain.test'),
		expectedMail: 'alice.aurora@near.mailchain.test',
		expectedHuman: 'alice.aurora@near',
	},
	{
		address: createNameServiceAddress('alice-very-long-name-alice.near', 'near.mailchain.test'),
		expectedMail: 'alice-very-long-name-alice.near@near.mailchain.test',
		expectedHuman: 'alice-very-long-name-alice.near',
	},
	{
		address: createNameServiceAddress('alice-very-long-name-alice.testnet', 'near.mailchain.test'),
		expectedMail: 'alice-very-long-name-alice.testnet@near.mailchain.test',
		expectedHuman: 'alice-very-long-name-alice.testnet@near',
	},
];

describe('addressFormatting', () => {
	test.each(testCases)(
		'should format address $address as mail address of $expectedMail',
		({ address, expectedMail }) => {
			const result = formatAddress(address, 'mail');

			expect(result).toEqual(expectedMail);
		},
	);

	test.each(testCases)(
		'should format address $address as human friendly address of $expectedHuman',
		({ address, expectedHuman }) => {
			const result = formatAddress(address, 'human-friendly');

			expect(result).toEqual(expectedHuman);
		},
	);
});
