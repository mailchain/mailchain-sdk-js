// WARNING: CAREFUL WHEN CHANGING THE VALUES OF THIS CONSTANTS, THEY MIGHT BE ALREADY LINKED TO KEY PATHS

/**
 * Algorand protocol name.
 */
export const ALGORAND = 'algorand' as const;
/**
 * Ethereum protocol name.
 */
export const ETHEREUM = 'ethereum' as const;
/**
 * Substrate protocol name.
 */
export const SUBSTRATE = 'substrate' as const;

export const NEAR = 'near' as const;

export const TEZOS = 'tezos' as const;

export const FILECOIN = 'filecoin' as const;

/**
 * Mailchain protocol name.
 */
export const MAILCHAIN = 'mailchain' as const;

export const ALL_PROTOCOLS = [ALGORAND, ETHEREUM, SUBSTRATE, NEAR, MAILCHAIN, TEZOS, FILECOIN] as const;
export type ProtocolType = (typeof ALL_PROTOCOLS)[number];

const ENABLED_PROTOCOLS = [ETHEREUM, NEAR, TEZOS, FILECOIN] as const;
export type EnabledBlockchainProtocol = (typeof ENABLED_PROTOCOLS)[number];
export function isBlockchainProtocolEnabled(protocol: string): protocol is EnabledBlockchainProtocol {
	return ENABLED_PROTOCOLS.includes(protocol as EnabledBlockchainProtocol);
}
