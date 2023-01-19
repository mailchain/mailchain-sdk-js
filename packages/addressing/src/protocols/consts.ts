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

/**
 * Mailchain protocol name.
 */
export const MAILCHAIN = 'mailchain' as const;

export const ALL_PROTOCOLS = [ALGORAND, ETHEREUM, SUBSTRATE, NEAR, MAILCHAIN] as const;
export type ProtocolType = typeof ALL_PROTOCOLS[number];
