import { NameServiceAddress, parseNameServiceAddress } from './nameServiceAddress';
import { formatAddress } from './addressFormatting';
import { isMailchainAccountAddress } from './addressPredicates';
import { decodeAddressByProtocol } from './encoding';
import { parseWalletAddress } from './parseWalletAddress';

/**
 * Compare two addresses for their equality.
 * @returns true if the addresses are equal, false if not.
 */
export function isSameAddress(a: string | NameServiceAddress, b: string | NameServiceAddress): boolean {
	if (typeof a === 'string') a = parseNameServiceAddress(a);
	if (typeof b === 'string') b = parseNameServiceAddress(b);

	const isEqualFns: AddressIsEqualFn[] = [
		domainAddressIsEqual,
		walletAddressIsEqual,
		mailchainAddressIsEqual,
		catchAllAddressIsEqual,
	];

	for (const isEqualFn of isEqualFns) {
		const result = isEqualFn(a, b);
		if (result !== undefined) return result;
	}
	throw new Error(`could not compare addresses ${formatAddress(a, 'mail')} and ${formatAddress(b, 'mail')}`);
}

/**
 * Function that compares two addresses for their equality.
 *
 * @returns true if the addresses are equal, false if not, undefined if the function cannot determine the equality.
 */
type AddressIsEqualFn = (a: NameServiceAddress, b: NameServiceAddress) => boolean | undefined;

/**
 * Compare two addresses for their domain equality.
 */
const domainAddressIsEqual: AddressIsEqualFn = (a: NameServiceAddress, b: NameServiceAddress) => {
	if (a.domain.toLowerCase() !== b.domain.toLowerCase()) return false;
	return undefined;
};

/**
 * Compare two addresses for their wallet protocol equality.
 */
const walletAddressIsEqual: AddressIsEqualFn = (a: NameServiceAddress, b: NameServiceAddress) => {
	const aWalletAddress = parseWalletAddress(a);
	const bWalletAddress = parseWalletAddress(b);

	if (!aWalletAddress && bWalletAddress) return false;
	if (aWalletAddress && !bWalletAddress) return false;
	if (!aWalletAddress || !bWalletAddress) return undefined;
	if (aWalletAddress.protocol !== bWalletAddress.protocol) return false;

	const aDecoded = decodeAddressByProtocol(a.username, aWalletAddress.protocol).decoded;
	const bDecoded = decodeAddressByProtocol(b.username, bWalletAddress.protocol).decoded;

	return aDecoded.length === bDecoded.length && aDecoded.every((v, i) => v === bDecoded[i]);
};

/**
 * Compare two addresses for their mailchain account equality.
 */
const mailchainAddressIsEqual: AddressIsEqualFn = (a: NameServiceAddress, b: NameServiceAddress) => {
	const aIsMailchain = isMailchainAccountAddress(a);
	const bIsMailchain = isMailchainAccountAddress(b);

	if (!aIsMailchain && bIsMailchain) return false;
	if (aIsMailchain && !bIsMailchain) return false;
	if (!aIsMailchain || !bIsMailchain) return undefined;

	return a.username.toLowerCase() === b.username.toLowerCase();
};

/**
 * Compare two addresses for by case insensitive comparing the username.
 */
const catchAllAddressIsEqual: AddressIsEqualFn = (a: NameServiceAddress, b: NameServiceAddress) => {
	return a.username.toLowerCase() === b.username.toLowerCase();
};
