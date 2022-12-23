export type NameserviceDescription = {
	readonly name: string;
	readonly domains: string[];
};

export const NAMESERVICE_DESCRIPTIONS: NameserviceDescription[] = [
	{ name: 'ens', domains: ['eth'] },
	{
		name: 'unstoppable',
		domains: ['crypto', 'wallet', 'blockchain', 'x', '888', 'nft', 'dao'],
	},
];