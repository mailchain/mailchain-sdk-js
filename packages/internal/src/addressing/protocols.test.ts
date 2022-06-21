import { ETHEREUM, MAILCHAIN } from '../protocols';
import { guessProtocolsFromAddress } from './protocols';

describe('guessProtocolsFromAddress', () => {
	const tests = [
		{
			name: '0x-hex-len-42',
			address: '0x91d8fd6afb0c50c817b08f3ce641d6c195ff0d4b',
			expected: [ETHEREUM],
		},
		{
			name: 'base64-len-42',
			address: '0O12LliI6afb0c50c817b08f3ce641d6c195ff0d4b',
			expected: [],
		},
		{
			name: 'hex-len-40',
			address: '91d8fd6afb0c50c817b08f3ce641d6c195ff0d4b',
			expected: [],
		},
		{
			name: 'plain-hex-len-42',
			address: '0091d8fd6afb0c50c817b08f3ce641d6c195ff0d4b',
			expected: [],
		},
		{
			name: '0x-hex-len-40',
			address: '0x91d8fd6afb0c50c817b08f3ce641d6c195ff0d',
			expected: [],
		},
		{
			name: '0x-hex-len-4',
			address: '0x91',
			expected: [MAILCHAIN],
		},
		{
			name: 'alpha-numeric-len-3',
			address: 'bob',
			expected: [MAILCHAIN],
		},
	];
	tests.forEach((test) => {
		it(test.name, () => {
			expect(guessProtocolsFromAddress(test.address)).toEqual(test.expected);
		});
	});
});
