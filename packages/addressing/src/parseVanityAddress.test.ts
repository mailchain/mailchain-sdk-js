import { getMailchainAddressFromString } from './parseVanityAddress';

describe('getMailchainAddressFromString', () => {
	const tests = [
		// name service
		{
			name: 'alice.eth',
			args: {
				input: 'alice.eth',
			},
			expected: { username: 'alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'alice.eth@',
			args: {
				input: 'alice.eth@',
			},
			expected: { username: 'alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'alice.eth@mailchain',
			args: {
				input: 'alice.eth@mailchain',
			},
			expected: { username: 'alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'alice.eth@mailchain.com',
			args: {
				input: 'alice.eth@mailchain.com',
			},
			expected: { username: 'alice.eth', domain: 'mailchain.com' },
		},
		// sub domain name service
		{
			name: 'sub.alice.eth',
			args: {
				input: 'sub.alice.eth',
			},
			expected: { username: 'sub.alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'sub.alice.eth@',
			args: {
				input: 'sub.alice.eth@',
			},
			expected: { username: 'sub.alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'sub.alice.eth@mailchain',
			args: {
				input: 'sub.alice.eth@mailchain',
			},
			expected: { username: 'sub.alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'sub.alice.eth@mailchain.com',
			args: {
				input: 'sub.alice.eth@mailchain.com',
			},
			expected: { username: 'sub.alice.eth', domain: 'mailchain.com' },
		},
		{
			name: 'sub.alice@eth.mailchain.com',
			args: {
				input: 'sub.alice@eth.mailchain.com',
			},
			expected: { username: 'sub.alice', domain: 'eth.mailchain.com' },
		},

		// specified name service
		{
			name: 'alice.eth@ens.mailchain.com',
			args: {
				input: 'alice.eth@ens.mailchain.com',
			},
			expected: { username: 'alice.eth', domain: 'ens.mailchain.com' },
		},
		{
			name: 'alice.eth@ens.ethereum.mailchain.com',
			args: {
				input: 'alice.eth@ens.ethereum.mailchain.com',
			},
			expected: { username: 'alice.eth', domain: 'ens.ethereum.mailchain.com' },
		},
		{
			name: 'sub.alice@near.mailchain.com',
			args: {
				input: 'sub.alice@near.mailchain.com',
			},
			expected: { username: 'sub.alice', domain: 'near.mailchain.com' },
		},
		{
			name: 'sub.alice@near.mailchain',
			args: {
				input: 'sub.alice@near.mailchain',
			},
			expected: { username: 'sub.alice', domain: 'near.mailchain.com' },
		},
		// blockchain addresses
		{
			name: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum',
			args: {
				input: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum',
			},
			expected: { username: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6', domain: 'ethereum.mailchain.com' },
		},
		{
			name: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.',
			args: {
				input: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.',
			},
			expected: { username: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6', domain: 'ethereum.mailchain.com' },
		},
		{
			name: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.mailchain',
			args: {
				input: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.mailchain',
			},
			expected: { username: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6', domain: 'ethereum.mailchain.com' },
		},
		{
			name: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.mailchain.com',
			args: {
				input: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6@ethereum.mailchain.com',
			},
			expected: { username: '0xD5ab4CE3605Cd590Db609b6b5C8901fdB2ef7FE6', domain: 'ethereum.mailchain.com' },
		},
	];
	test.each(tests)('$name', async (test) => {
		expect(getMailchainAddressFromString(test.args.input, 'mailchain.com')).toEqual(test.expected);
	});
});
