import { MailchainAddress } from '.';

export function getMailchainAddressFromString(address: string, mailchainMailDomain: string): MailchainAddress {
	// its a local part only so assume it's a TLD name service.
	if (address.indexOf('@') === -1) {
		return {
			username: address,
			domain: mailchainMailDomain,
		};
	}

	// when looking for mailchain MUST lowercase string
	const MAILCHAIN = 'mailchain';
	const [username, domain] = address.split('@');
	// fully qualified TLD e.g
	const isFullyQualifiedTLD = domain.toLowerCase().endsWith(mailchainMailDomain.toLowerCase());
	// check if @mailchain is present means its a mailchain username or TLD mapped name service
	const isMailchainSupportedNameService = domain.toLowerCase().startsWith(MAILCHAIN);
	const isTLDMailchain = domain.toLowerCase().endsWith(MAILCHAIN);
	const providedAddressDomainEndWithDot = domain.endsWith('.');
	// domain part is empty so assume it's a TLD name service.
	if (domain.trim().length === 0) {
		return {
			username,
			domain: mailchainMailDomain,
		};
	}
	// this check needs to happen early
	if (isMailchainSupportedNameService) {
		return {
			username,
			domain: mailchainMailDomain,
		};
	}

	if (isFullyQualifiedTLD) {
		return {
			username,
			domain,
		};
	}

	// change domain part mailchain -> mailchain.com
	if (isTLDMailchain) {
		return {
			username,
			domain: `${domain.toLowerCase().slice(0, -MAILCHAIN.length)}${mailchainMailDomain}`,
		};
	}

	if (providedAddressDomainEndWithDot) {
		return {
			username,
			domain: `${domain}${mailchainMailDomain}`,
		};
	}
	return {
		username,
		domain: `${domain}.${mailchainMailDomain}`,
	};
}
