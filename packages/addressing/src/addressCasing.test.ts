import { casingByProtocol } from './addressCasing';
import { ALGORAND, ETHEREUM, MAILCHAIN, NEAR, ProtocolType, SUBSTRATE } from './protocols';

const formatMailchainValueTests: { testName: string; value: string; protocol: ProtocolType; expected: string }[] = [
	{
		testName: 'should have lower case for mailchain protocol',
		value: 'AlIcE',
		protocol: MAILCHAIN,
		expected: 'alice',
	},
	{
		testName: 'should have lower case for ethereum protocol',
		value: '0x0E5736FBD198496Ef9A890a8D8be7538De9B2e0f',
		protocol: ETHEREUM,
		expected: '0x0e5736fbd198496ef9a890a8d8be7538de9b2e0f',
	},
	{
		testName: 'should have mixed case for substrate protocol',
		value: '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX',
		protocol: SUBSTRATE,
		expected: '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX',
	},
	{
		testName: 'should have lower case for algorand protocol',
		value: 'Z4X3PU5L6X3IPHE3CB5IEIS52TE5GU3GZFOOWW7BOTVXK5BCYR3444OQDW',
		protocol: ALGORAND,
		expected: 'z4x3pu5l6x3iphe3cb5ieis52te5gu3gzfooww7botvxk5bcyr3444oqdw',
	},
	{
		testName: 'should have lower case for near protocol',
		value: '98793CD91A3F870FB126F66285808C7E094AFCFC4EDA8A970F6648CDF0DBD6DE',
		protocol: NEAR,
		expected: '98793cd91a3f870fb126f66285808c7e094afcfc4eda8a970f6648cdf0dbd6de',
	},
	{ testName: '', value: '', protocol: MAILCHAIN, expected: '' },
];

test.each(formatMailchainValueTests)('$testName', ({ value, protocol, expected }) => {
	expect(casingByProtocol(value, protocol)).toEqual(expected);
});
