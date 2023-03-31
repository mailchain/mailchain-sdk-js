/**
 * Used to represent generic address with `username` and `domain` parts
 *
 * - Example 1: 'alice.eth@.ens.mailchain.com'
 * - Example 2: 'alice@eth.ens.mailchain.com'
 */
export type NameServiceAddress = {
	/**
	 * The username part of the address (the part before the "@").
	 *
	 * - Example 1: the 'alice.eth' out of 'alice.eth@ens.mailchain.com'
	 * - Example 2: the '0xaB15101053d4382118797EBb3FF6cD1C83d15A03' out of '0xaB15101053d4382118797EBb3FF6cD1C83d15A03@ethereum.mailchain.com'
	 */
	username: string;
	/**
	 * The domain part of the address (the part after the "@").
	 *
	 * - Example 1: the 'ens.mailchain.com' out of 'alice.eth@ens.mailchain.com'
	 * - Example 2: the 'ethereum.mailchain.com' out of '0xaB15101053d4382118797EBb3FF6cD1C83d15A03@ethereum.mailchain.com'
	 */
	domain: string;
};

/**
 * @param username must be defined and be non-empty string
 * @param domainParts each of the parts in the domain, will be joined with dot `"."`
 */
export function createNameServiceAddress(username: string, ...domainParts: [string, ...string[]]): NameServiceAddress {
	const domain = domainParts
		.filter((d) => d != null)
		.join('.')
		.toLowerCase();
	if (username && username.length > 0 && domain && domain.length > 0) return { username, domain };
	throw new Error(`invalid name service address with username [${username}] and domain [${domain}]`);
}

export function parseNameServiceAddress(address: string): NameServiceAddress {
	const [username, domain] = address.split('@');
	if (username && domain) return createNameServiceAddress(username, domain);
	throw new Error(`invalid address format of [${address}]`);
}

export function isSameNameServiceAddress(a: NameServiceAddress, b: NameServiceAddress): boolean {
	return a.username === b.username && a.domain === b.domain;
}

export function isNameServiceAddress(a: any): a is NameServiceAddress {
	return typeof a.username === 'string' && typeof a.domain === 'string';
}
