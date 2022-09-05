import { createMailchainAddress, MailchainAddress } from './mailchainAddress';
import { MAILCHAIN, ProtocolType } from './protocols';

const createMailchainAddressTests: {
	testName: string;
	params: Parameters<typeof createMailchainAddress>;
	expected: MailchainAddress;
}[] = [
	{
		testName: 'simple mailchain',
		params: ['alice', MAILCHAIN, 'mailchain.test'],
		expected: { value: 'alice', protocol: MAILCHAIN, domain: 'mailchain.test' },
	},
	{
		testName: 'value mixed case',
		params: ['AlIcE', MAILCHAIN, 'mailchain.test'],
		expected: { value: 'alice', protocol: MAILCHAIN, domain: 'mailchain.test' },
	},
	{
		testName: 'value and protocol mixed case',
		params: ['AlIcE', 'MaIlChAiN' as ProtocolType, 'mailchain.test'],
		expected: { value: 'alice', protocol: MAILCHAIN, domain: 'mailchain.test' },
	},
	{
		testName: 'domain mixed case',
		params: ['alice', MAILCHAIN, 'MaIlChAiN.TeSt'],
		expected: { value: 'alice', protocol: MAILCHAIN, domain: 'mailchain.test' },
	},
];

test.each(createMailchainAddressTests)('$testName', ({ params, expected }) => {
	expect(createMailchainAddress(...params)).toEqual(expected);
});
