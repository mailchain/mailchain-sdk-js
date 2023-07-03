import { NameServiceAddress as MailchainAddress, NameServiceAddress } from './nameServiceAddress';
import { parseWalletAddress } from './parseWalletAddress';
import { ETHEREUM, NEAR, TEZOS } from './protocols';
import { validateTezosAddress } from './protocols/tezos/address';
import { validateFilecoinAddress } from './protocols/filecoin/address';
import { validateNearImplicitAccount } from './protocols/near/address';
import { validateEthereumAddress } from './protocols/ethereum/address';

export function isMailchainAccountAddress(address: NameServiceAddress): boolean {
	const isMailchainUsername = address.username.match(/(^[a-zA-Z0-9][_\-a-zA-Z0-9]{0,18}[a-zA-Z0-9])$/) != null;
	const isJustMailchainDomain = address.domain.match(/^mailchain\.[a-z]+$/) != null;

	return isMailchainUsername && isJustMailchainDomain;
}

export function isEthereumAddress(address: MailchainAddress): boolean {
	const props = parseWalletAddress(address);

	if (props?.protocol !== ETHEREUM) return false;
	return validateEthereumAddress(address.username);
}

export function isNearImplicitAccount(address: MailchainAddress): boolean {
	const props = parseWalletAddress(address);

	if (props?.protocol !== NEAR) return false;
	return validateNearImplicitAccount(address.username);
}

export function isTezosAddress(address: MailchainAddress): boolean {
	const props = parseWalletAddress(address);

	if (props?.protocol !== TEZOS) return false;
	return validateTezosAddress(address.username);
}

export function isFilecoinAddress(address: MailchainAddress): boolean {
	const domainParts = address.domain.split('.');

	if (domainParts[0] !== 'filecoin') return false;
	return validateFilecoinAddress(address.username);
}
