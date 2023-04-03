import { isAnyHex } from '@mailchain/encoding';
import { isBase58 } from '@polkadot/util-crypto';
import { NameServiceAddress as MailchainAddress, NameServiceAddress } from './nameServiceAddress';
import { parseWalletAddress } from './parseWalletAddress';
import { ETHEREUM, NEAR } from './protocols';
import { Prefix } from './protocols/tezos/const';

export function isMailchainAccountAddress(address: NameServiceAddress): boolean {
	const isMailchainUsername = address.username.match(/(^[a-zA-Z0-9][_\-a-zA-Z0-9]{0,18}[a-zA-Z0-9])$/) != null;
	const isJustMailchainDomain = address.domain.match(/^mailchain\.[a-z]+$/) != null;

	return isMailchainUsername && isJustMailchainDomain;
}

export function isEthereumAddress(address: MailchainAddress): boolean {
	const props = parseWalletAddress(address);

	if (props?.protocol !== ETHEREUM) return false;

	return address.username.length === 42 && address.username.startsWith('0x') && isAnyHex(address.username);
}

export function isNearImplicitAccount(address: MailchainAddress): boolean {
	const props = parseWalletAddress(address);

	if (props?.protocol !== NEAR) return false;
	return (
		address.username.length === 64 &&
		address.username.match(/^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/) != null
	);
}

export function isTezosAddress(address: MailchainAddress): boolean {
	return (
		address.username.length === 36 &&
		[Prefix.TZ1, Prefix.TZ2, Prefix.TZ3].includes(address.username.slice(0, 3) as Prefix) &&
		isBase58(address.username.slice(3))
	);
}
