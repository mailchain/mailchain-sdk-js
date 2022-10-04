import { isEthereumAddress, isMailchainAccountAddress } from './addressPredicates';
import { createNameServiceAddress } from './nameServiceAddress';
import { ETHEREUM, SUBSTRATE } from './protocols';
import { createWalletAddress } from './walletAddress';

describe('mailchain account', () => {
	const positiveCases = [
		createNameServiceAddress('alice', 'mailchain.com'),
		createNameServiceAddress('alice', 'mailchain.dev'),
		createNameServiceAddress('alice', 'mailchain.test'),
		createNameServiceAddress('alice', 'mailchain.a'),
		createNameServiceAddress('hi', 'mailchain.com'),
		createNameServiceAddress('hey', 'mailchain.com'),
		createNameServiceAddress('h-y', 'mailchain.com'),
		createNameServiceAddress('alice', 'mailchain.qwertyasdfgzxcvbn'),
		createNameServiceAddress('alice-eth', 'mailchain.com'),
		createNameServiceAddress('alice_eth', 'mailchain.com'),
		createNameServiceAddress('alice-personal', 'mailchain.com'),
		createNameServiceAddress('0xalice', 'mailchain.com'),
		createNameServiceAddress('0000', 'mailchain.com'),
	];

	test.each(positiveCases)('%s should be identified as mailchain account address', (address) => {
		expect(isMailchainAccountAddress(address)).toBe(true);
	});

	const negativeCases = [
		// invalid domain
		createNameServiceAddress('alice', 'eth.mailchain.com'),
		createNameServiceAddress('alice', 'mailchain.domain.com'),
		createNameServiceAddress('alice', 'domain.mailchain'),
		createNameServiceAddress('alice', 'mailchain.com.com'),
		createNameServiceAddress('alice', 'mailchain.mailchain.com'),
		createNameServiceAddress('alice', 'ethereum.mailchain.com'),
		createNameServiceAddress('alice', 'mailchain.com1'),
		// invalid username
		createNameServiceAddress('a', 'mailchain.com'),
		createNameServiceAddress('_alice', 'mailchain.com'),
		createNameServiceAddress('-alice', 'mailchain.com'),
		createNameServiceAddress('alice_', 'mailchain.com'),
		createNameServiceAddress('alice-', 'mailchain.com'),
		createNameServiceAddress('alice+test', 'mailchain.com'),
		createNameServiceAddress('alice.', 'mailchain.com'),
		createNameServiceAddress('0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A55', 'mailchain.com'),
		createNameServiceAddress('alice.eth', 'mailchain.com'),
		createNameServiceAddress('алице', 'mailchain.com'),
	];

	test.each(negativeCases)('%s should NOT be identified as mailchain account address', (address) => {
		expect(isMailchainAccountAddress(address)).toBe(false);
	});
});

describe('ethereum address', () => {
	const positiveCases = [
		createWalletAddress('0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A55', ETHEREUM, 'mailchain.com'),
		createWalletAddress('0xEBaae0532dF65ee3f1623f324C9620bB84c8af8d', ETHEREUM, 'mailchain.dev'),
		createWalletAddress('0xEBaae0532dF65ee3f1623f324C9620bB84c8af8d', ETHEREUM, 'whatever.whatever'),
		createWalletAddress('0xEBaae0532dF65ee3f1623f324C9620bB84c8af8d', ETHEREUM, 'whatever.mailchain.dev'),
	];

	test.each(positiveCases)('%s should be identified as ethereum address', (address) => {
		expect(isEthereumAddress(address)).toBe(true);
	});

	const negativeCases = [
		createWalletAddress('dDfFC3003797e44FCd103eE7A4aE78Ed02853A55', ETHEREUM, 'mailchain.com'), // missing 0x
		createWalletAddress('dDfFC3003797e44FCd103eE7A4aE78Ed02853A55', ETHEREUM, 'mailchain.com'), // missing 0x
		createWalletAddress('0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A5', ETHEREUM, 'mailchain'),
		createWalletAddress('alice', ETHEREUM, 'mailchain.com'),
		createWalletAddress('alice.eth', ETHEREUM, 'mailchain.com'),
		createWalletAddress('alice', ETHEREUM, 'eth.mailchain.com'),
		createNameServiceAddress('alice', 'eth', ETHEREUM, 'mailchain.com'),
		createWalletAddress('0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A55', SUBSTRATE, 'mailchain.com'),
	];

	test.each(negativeCases)('%s should NOT be identified as ethereum address', (address) => {
		expect(isEthereumAddress(address)).toBe(false);
	});
});
