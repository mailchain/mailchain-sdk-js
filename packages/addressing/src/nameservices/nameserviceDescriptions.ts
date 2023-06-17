export type NameserviceDescription = {
	/**
	 * The name of the nameservice.
	 *
	 * Example: in `alice.eth@ens.mailchain.com`, the `ens` part is considered the name of the nameservice.
	 */
	readonly name: string;
	/**
	 * The list of domains that the nameservice supports.
	 *
	 * Example: in `alice.eth@ens.mailchain.com`, the `eth` part is considered the domain.
	 */
	readonly domains: string[];
	/**
	 * Whether the nameservice supports subdomains of the defined domains.
	 *
	 * Example: `alice.eth` is the regular domain, but having `billing.alice.eth` is considered subdomain.
	 *
	 * If the nameservice doesn't support subdomains, then `alice.eth` is the only valid domain.
	 *
	 * Defaults to `true`.
	 */
	readonly supportsSubdomains?: boolean;
};

export const NAMESERVICE_DESCRIPTIONS: NameserviceDescription[] = [
	{
		name: 'ens',
		domains: ['cb.id', 'eth'],
	},
	{
		name: 'unstoppable',
		domains: ['crypto', 'wallet', 'blockchain', 'x', '888', 'nft', 'dao'],
	},
	{
		name: 'freename',
		domains: ['aurora', 'hodl'],
	},
	{
		name: 'lens',
		domains: ['lens'],
	},
	{
		name: 'spaceid',
		domains: ['arb', 'bnb'],
		supportsSubdomains: false,
	},
	{
		name: 'tezosdomains',
		domains: ['tez'],
	},
	{
		name: 'avvy',
		domains: ['avax'],
	},
];
