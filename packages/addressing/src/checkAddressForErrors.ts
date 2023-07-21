import { BadlyFormattedAddressError, IdentityProviderAddressInvalidError } from './errors';
import { ETHEREUM, NEAR, TEZOS } from './protocols';
import { validateEthereumAddress, validateEthereumTokenOwnerAddress } from './protocols/ethereum/address';
import { validateNearAccountId } from './protocols/near/address';
import { validateTezosAddress } from './protocols/tezos/address';
import { validateFilecoinAddress } from './protocols/filecoin/address';

export type ValidateAddressError = BadlyFormattedAddressError | IdentityProviderAddressInvalidError;

const DEFAULT_MAILCHAIN_DOMAIN = 'mailchain.com';

/**
 * Performs offline checks to see if an address is invalid. Even if there is no error addresses need to be resolved to be sure they are valid.
 *
 * @param address fully qualified address to check
 * @param mailchainDomain
 * @returns an error if it's invalid or undefined if validation passes.
 */
export function checkAddressForErrors(
	address: string,
	mailchainDomain = DEFAULT_MAILCHAIN_DOMAIN,
): ValidateAddressError | undefined {
	address = address.trim();
	if (!address.endsWith(`${mailchainDomain}`)) {
		return new BadlyFormattedAddressError();
	}

	const parts = address.split('@');
	if (parts.length !== 2) {
		return new BadlyFormattedAddressError();
	}
	const local = parts[0];
	const domain = parts[1];
	const domainParts = parts[1].split('.');

	if (domain === DEFAULT_MAILCHAIN_DOMAIN) {
		return validateMailchainProtocolAddress(local);
	} else if (domainParts.length === 3) {
		return validateIdentityProviderAddress(local, domainParts[0]);
	}

	// At this point there are no errors but we don't know if the address is valid, it needs to be resolved
	return undefined;
}

function validateMailchainProtocolAddress(tldTrimmedAddress: string): IdentityProviderAddressInvalidError | undefined {
	const mailchainAddressPattern = /^[a-zA-Z0-9-_]{2,20}$/;

	if (!mailchainAddressPattern.test(tldTrimmedAddress)) {
		// check mailchain protocol address
		return new IdentityProviderAddressInvalidError();
	}

	return undefined;
}

function validateIdentityProviderAddress(
	address: string,
	identityProvider: string,
): IdentityProviderAddressInvalidError | undefined {
	switch (identityProvider) {
		case ETHEREUM:
			if (!validateEthereumAddress(address) && !validateEthereumTokenOwnerAddress(address)) {
				return new IdentityProviderAddressInvalidError();
			}
			break;
		case NEAR:
			if (!validateNearAccountId(address)) {
				return new IdentityProviderAddressInvalidError();
			}
			break;
		case TEZOS:
			if (!validateTezosAddress(address)) {
				return new IdentityProviderAddressInvalidError();
			}
			break;
		case 'filecoin':
			if (!validateFilecoinAddress(address)) {
				return new IdentityProviderAddressInvalidError();
			}
			break;
	}

	// couldn't find the identity provider or it passed validation.
	// doesn't mean it's valid but it didn't fail offline validation
	return undefined;
}
