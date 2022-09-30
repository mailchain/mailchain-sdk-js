import { mnemonicGenerate, mnemonicValidate, mnemonicToLegacySeed } from '@polkadot/util-crypto/mnemonic';
import { entropyToMnemonic, mnemonicToEntropy } from '@polkadot/util-crypto/mnemonic/bip39';

export function generate(words: 12 | 15 | 18 | 21 | 24 = 24): string {
	return mnemonicGenerate(words, true);
}

export function toEntropy(mnemonic: string): Uint8Array {
	return mnemonicToEntropy(mnemonic);
}

export function fromEntropy(entropy: Uint8Array): string {
	return entropyToMnemonic(entropy);
}

export function validate(mnemonic: string): boolean {
	return mnemonicValidate(mnemonic, true);
}

export function toSeed(mnemonic: string, password?: string, byteLength?: 32 | 64 | undefined): Uint8Array {
	return mnemonicToLegacySeed(mnemonic, password, true, byteLength);
}
