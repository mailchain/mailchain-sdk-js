export const EncodingTypes = {
	/**
	 * Plain hex encoding value.
	 */
	Hex: 'hex/plain',
	/**
	 * 0x prefixed hex encoding
	 */
	Hex0xPrefix: 'hex/0x-prefix',
	Base32: 'base32/plain',
	Base58: 'base58/plain',
	Base64: 'base64/plain',
	Base62Url: 'base64/url',
	Base58SubstrateAddress: 'base58/ss58-address',
	Utf8: 'text/utf-8',
} as const;

export type EncodingType = typeof EncodingTypes[keyof typeof EncodingTypes];
