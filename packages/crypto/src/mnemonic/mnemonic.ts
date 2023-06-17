import {
	entropyToMnemonic,
	mnemonicToEntropy,
	generateMnemonic,
	validateMnemonic,
	mnemonicToSeedSync,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export function generate(words: 12 | 24 = 24): string {
	return generateMnemonic(wordlist, words === 12 ? 128 : 256);
}

export function toEntropy(mnemonic: string): Uint8Array {
	return mnemonicToEntropy(mnemonic, wordlist);
}

export function fromEntropy(entropy: Uint8Array): string {
	return entropyToMnemonic(entropy, wordlist);
}

export function validate(mnemonic: string): boolean {
	return validateMnemonic(mnemonic, wordlist);
}

export function toSeed(mnemonic: string, password?: string, byteLength?: 32 | 64 | undefined): Uint8Array {
	if (!validate(mnemonic)) {
		throw new Error('Invalid mnemonic');
	}
	return mnemonicToSeedSync(mnemonic, password).slice(0, byteLength === undefined ? 32 : byteLength);
}
