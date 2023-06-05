export type NameserviceDescription = {
	readonly name: string;
	readonly domains: string[];
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
