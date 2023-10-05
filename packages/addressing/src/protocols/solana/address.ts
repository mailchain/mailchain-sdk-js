import { KindED25519, PublicKey } from '@mailchain/crypto';
import { decodeBase58 } from '@mailchain/encoding';

export function validateSolanaAddress(addressID: string) {
	try {
		const address = decodeBase58(addressID);
		return address.length === 32;
	} catch (e) {
		return false;
	}
}

export function solanaAddressFromPublicKey(publicKey: PublicKey): Uint8Array {
	if (publicKey.curve !== KindED25519) throw new Error('Only ED25519 is supported for Solana');
	if (publicKey.bytes.length !== 32) throw new Error('Invalid public key length for Solana');
	return publicKey.bytes;
}
