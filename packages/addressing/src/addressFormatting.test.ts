import { ALGORAND, ETHEREUM, MAILCHAIN, SUBSTRATE } from './protocols';
import { formatAddress } from './addressFormatting';
import { MailchainAddress } from './types';

const testCases: { address: MailchainAddress; expectedMail: string; expectedHuman: string }[] = [
	{
		address: {
			value: '0x492d61cD88255EbC8556c6393AFA3f3ac2B0505E',
			protocol: ETHEREUM,
			domain: 'mailchain.local',
		},
		expectedMail: '0x492d61cD88255EbC8556c6393AFA3f3ac2B0505E@ethereum.mailchain.local',
		expectedHuman: '0x492d...505E@ethereum',
	},
	{
		address: {
			value: '492d61cD88255EbC8556c6393AFA3f3ac2B0505E',
			protocol: ALGORAND,
			domain: 'mailchain.com',
		},
		expectedMail: '492d61cD88255EbC8556c6393AFA3f3ac2B0505E@algorand.mailchain.com',
		expectedHuman: '492d...505E@algorand',
	},
	{
		address: {
			value: '492d61cD88255EbC8556c6393AFA3f3ac2B0505E',
			protocol: SUBSTRATE,
			domain: 'mailchain.dev',
		},
		expectedMail: '492d61cD88255EbC8556c6393AFA3f3ac2B0505E@substrate.mailchain.dev',
		expectedHuman: '492d...505E@substrate',
	},
	{
		address: {
			value: 'account',
			protocol: MAILCHAIN,
			domain: 'mailchain.xyz',
		},
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
