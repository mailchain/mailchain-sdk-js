import { ALGORAND, ETHEREUM, MAILCHAIN, SUBSTRATE } from './protocols';
import { formatAddress } from './addressFormatting';
import { createMailchainAddress, MailchainAddress } from '.';

const testCases: { address: MailchainAddress; expectedMail: string; expectedHuman: string }[] = [
	{
		address: createMailchainAddress('0x492d61cD88255EbC8556c6393AFA3f3ac2B0505E', ETHEREUM, 'mailchain.local'),
		expectedMail: '0x492d61cd88255ebc8556c6393afa3f3ac2b0505e@ethereum.mailchain.local',
		expectedHuman: '0x492d...505e@ethereum',
	},
	{
		address: createMailchainAddress('492d61cD88255EbC8556c6393AFA3f3ac2B0505E', ALGORAND, 'mailchain.com'),
		expectedMail: '492D61CD88255EBC8556C6393AFA3F3AC2B0505E@algorand.mailchain.com',
		expectedHuman: '492D...505E@algorand',
	},
	{
		address: createMailchainAddress('492d61cD88255EbC8556c6393AFA3f3ac2B0505E', SUBSTRATE, 'mailchain.dev'),
		expectedMail: '492d61cD88255EbC8556c6393AFA3f3ac2B0505E@substrate.mailchain.dev',
		expectedHuman: '492d...505E@substrate',
	},
	{
		address: createMailchainAddress('account', MAILCHAIN, 'mailchain.xyz'),
		expectedMail: 'account@mailchain.xyz',
		expectedHuman: 'account@mailchain',
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
