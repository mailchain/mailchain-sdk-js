export type Configuration = {
	apiPath: string;
	mailchainAddressDomain: string;
	nearRpcUrl: string;
};

export const defaultConfiguration: Configuration = {
	apiPath: 'https://api.mailchain.com',
	mailchainAddressDomain: 'mailchain.com',
	nearRpcUrl: 'https://rpc.near.org',
};
