import { createNameServiceAddress } from '../nameServiceAddress';
import { matchesNameservice } from './matchesNameservice';

describe('matchesNameservice', () => {
	const testCases = [
		{
			testName: "match 'eth' domain for address",
			address: createNameServiceAddress('alice.eth', 'ens.mailchain.test'),
			nsDescription: { name: 'ens', domains: ['xyz', 'eth', '1337'] },
			expectedMatch: 'eth',
		},
		{
			testName: "should not match because the domain doesn't start with NS name",
			address: createNameServiceAddress('alice.eth', 'unstoppable.mailchain.test'),
			nsDescription: { name: 'ens', domains: ['eth'] },
			expectedMatch: undefined,
		},
		{
			testName: "should not match because the domain doesn't start with exact NS name",
			address: createNameServiceAddress('alice.eth', 'ens.mailchain.test'),
			nsDescription: { name: 'en', domains: ['eth'] },
			expectedMatch: undefined,
		},
		{
			testName: "should not match because the username doesn't end with NS domain",
			address: createNameServiceAddress('alice.crypto', 'ens.mailchain.test'),
			nsDescription: { name: 'ens', domains: ['eth'] },
			expectedMatch: undefined,
		},
		{
			testName: "should not match because the username doesn't end with exact NS domain",
			address: createNameServiceAddress('alice.eth', 'ens.mailchain.test'),
			nsDescription: { name: 'ens', domains: ['th'] },
			expectedMatch: undefined,
		},
	];

	test.each(testCases)('$testName', ({ address, nsDescription, expectedMatch }) => {
		expect(matchesNameservice(address, nsDescription)).toEqual(expectedMatch);
	});
});
