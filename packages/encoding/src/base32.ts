import { utils } from '@scure/base';

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';
const coder = utils.chain(
	// We define our own chain, the default base32 has padding
	utils.radix2(5),
	utils.alphabet(BASE32_ALPHABET),
	{
		decode: (input) => input.split(''),
		encode: (input) => input.join(''),
	},
);
export function decodeBase32(input: string): Uint8Array {
	return coder.decode(input);
}

export function encodeBase32(input: Uint8Array): string {
	return coder.encode(input);
}

export function isBase32(input: string): boolean {
	// Check that all characters are valid base32 characters
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		if (BASE32_ALPHABET.indexOf(char.toLowerCase()) === -1) {
			return false;
		}
	}

	// Check that the input length is a multiple of 8 bits
	if (input.length % 8 !== 0) {
		return false;
	}

	return true;
}
