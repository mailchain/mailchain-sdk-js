import {
	isEthereumAddress,
	isMailchainAccountAddress,
	isNearImplicitAccount,
	isTezosAddress,
} from './addressPredicates';
import { decodeAddressByProtocol } from './encoding';
import { formatMailLike } from './formatMailLike';
import {
	NameServiceAddress as MailchainAddress,
	NameServiceAddress,
	createNameServiceAddress,
} from './nameServiceAddress';
import { matchesNameservice } from './nameservices/matchesNameservice';
import { NAMESERVICE_DESCRIPTIONS } from './nameservices/nameserviceDescriptions';
import { parseWalletAddress } from './parseWalletAddress';
import { ETHEREUM, NEAR, TEZOS } from './protocols';

/** If the rule is applicable,format the provided address. If not applicable, return `undefined`  */
export type AddressFormattingRule<T extends MailchainAddress> = (address: T) => string | undefined;

type NameServiceAddressFormatter = AddressFormattingRule<NameServiceAddress>;

/**
 * alice@mailchian.com
 */
const humanMailchainAccount: NameServiceAddressFormatter = (address) => {
	if (isMailchainAccountAddress(address)) {
		const domainParts = address.domain.split('.');
		return formatMailLike(address.username, domainParts[0]);
	}
	return undefined;
};

const humanNearAddress: NameServiceAddressFormatter = (address) => {
	const props = parseWalletAddress(address);
	if (props == null || props.protocol !== NEAR) return;

	const usernameParts = address.username.split('.');
	if (
		usernameParts.length == 1 &&
		isNearImplicitAccount({
			domain: address.domain,
			username: usernameParts[0],
		})
	) {
		return formatMailLike(
			[`${usernameParts[0].slice(0, 6)}...${usernameParts[0].slice(-4)}`, ...usernameParts.slice(1)].join('.'),
			props.protocol,
		);
	} else if (
		usernameParts.length >= 2 &&
		isNearImplicitAccount({
			domain: address.domain,
			username: usernameParts[0],
		}) &&
		usernameParts[usernameParts.length - 1] !== 'near'
	) {
		// testnet or local implicit accounts
		return formatMailLike(
			[`${usernameParts[0].slice(0, 6)}...${usernameParts[0].slice(-4)}`, ...usernameParts.slice(1)].join('.'),
			props.protocol,
		);
	} else if (usernameParts.length >= 2 && usernameParts[usernameParts.length - 1] !== 'near') {
		// testnet or local named accounts
		return formatMailLike(address.username, props.protocol);
	}

	return address.username;
};

const humanTezosAddress: NameServiceAddressFormatter = (address) => {
	if (!isTezosAddress(address)) return undefined;
	return formatMailLike(`${address.username.slice(0, 7)}...${address.username.slice(-4)}`, TEZOS);
};

const humanEthereumAddress: NameServiceAddressFormatter = (address) => {
	if (!isEthereumAddress(address)) return undefined;
	return formatMailLike(`${address.username.slice(0, 6)}...${address.username.slice(-4)}`, ETHEREUM);
};

/**
 * `0xdDfFC3003797e44FCd103eE7A4aE78Ed02853A55@ethereum.mailchain.com` into `0xdDfFC...3A55@ethereum`
 */
const humanWalletAddress: NameServiceAddressFormatter = (address) => {
	const domainParts = address.domain.split('.');
	if (domainParts.length <= 2) return undefined;

	const props = parseWalletAddress(address);
	if (props == null) return undefined;

	try {
		// native test by trying to decode username
		decodeAddressByProtocol(address.username, props.protocol);
		return formatMailLike(`${address.username.slice(0, 4)}...${address.username.slice(-4)}`, props.protocol);
	} catch (e) {
		return undefined;
	}
};

/**
 * Address with matching NS description `alice.eth@ens.mailchain.com` into `alice.eth`
 */
const humanNsAddress: NameServiceAddressFormatter = (address) => {
	for (const desc of NAMESERVICE_DESCRIPTIONS) {
		const matchingNsDomain = matchesNameservice(address, desc);
		if (matchingNsDomain) {
			return address.username;
		}
	}

	return undefined;
};

const humanTokenAddress: NameServiceAddressFormatter = (address: NameServiceAddress) => {
	const usernameParts = address.username.split('.');
	if (usernameParts.length !== 2) return undefined;
	const [tokenId, walletUsername] = usernameParts;
	if (/^\d+$/.test(tokenId) === false) return undefined;

	const walletAddress = createNameServiceAddress(walletUsername, address.domain);
	const walletProps = parseWalletAddress(walletAddress);
	if (walletProps == null) return undefined;

	let walletAddressStr: string | undefined = undefined;
	switch (walletProps.protocol) {
		case ETHEREUM:
			walletAddressStr = humanEthereumAddress(walletAddress);
			break;
		case NEAR:
			walletAddressStr = humanNearAddress(walletAddress);
			break;
		case TEZOS:
			walletAddressStr = humanTezosAddress(walletAddress);
			break;
		default:
			return undefined;
	}

	if (walletAddressStr == null) return undefined;
	return `${tokenId}.${walletAddressStr}`;
};

/** If the other formatting rules fail, apply this generic one */
const humanCatchAll: NameServiceAddressFormatter = (address) => {
	const domainParts = address.domain.split('.');
	if (domainParts.length === 2) {
		return formatMailLike(address.username, domainParts[0]);
	} else if (domainParts.length > 2) {
		const domainPartsToInclude = domainParts.slice(0, -2); // drop the last two
		return formatMailLike(address.username, ...domainPartsToInclude);
	}
	return formatMailLike(address.username, address.domain);
};

export const humanNameServiceFormatters = [
	humanMailchainAccount,
	humanNearAddress,
	humanTezosAddress,
	humanEthereumAddress,
	humanTokenAddress,
	humanNsAddress,
	humanWalletAddress,
	humanCatchAll,
] as const;
