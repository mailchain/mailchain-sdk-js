import { ETHEREUM, MAILCHAIN, ProtocolType } from './protocols';
import { createWalletAddress, MailchainAddress } from '.';

const createWalletAddressTests: {
	testName: string;
	params: Parameters<typeof createWalletAddress>;
	expected: MailchainAddress;
}[] = [
	{
		testName: 'simple mailchain',
		params: ['alice', MAILCHAIN, 'mailchain.test'],
		expected: { username: 'alice', domain: 'mailchain.test' },
	},
	{
		testName: 'value mixed case',
		params: ['AlIcE', MAILCHAIN, 'mailchain.test'],
		expected: { username: 'alice', domain: 'mailchain.test' },
	},
	{
		testName: 'value and protocol mixed case',
		params: ['AlIcE', 'MaIlChAiN' as ProtocolType, 'mailchain.test'],
		expected: { username: 'alice', domain: 'mailchain.test' },
	},
	{
		testName: 'domain mixed case',
		params: ['alice', MAILCHAIN, 'MaIlChAiN.TeSt'],
		expected: { username: 'alice', domain: 'mailchain.test' },
	},
	{
		testName: 'ethereum address',
		params: ['0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A55', ETHEREUM, 'mailchain.test'],
		expected: { username: '0xddffc3003797e44fcd103ee7a4ae78ed02853a55', domain: 'ethereum.mailchain.test' },
	},
];

test.each(createWalletAddressTests)('$testName', ({ params, expected }) => {
	expect(createWalletAddress(...params)).toEqual(expected);
});
