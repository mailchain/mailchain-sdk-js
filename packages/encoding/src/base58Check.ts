import { sha256 } from '@noble/hashes/sha256';
import { decodeBase58, encodeBase58 } from './base58';

export function decodeBase58Check(input: string): Uint8Array {
	const validatedPayload = validatePayload(decodeBase58(input));
	if (validatedPayload == null) throw new Error('failed input checksum validation');
	return validatedPayload;
}

export function encodeBase58Check(input: Uint8Array): string {
	const checksum = calcChecksum(input).slice(0, 4);
	return encodeBase58(Uint8Array.from([...input, ...checksum]));
}

// Ref: https://github.com/bitcoinjs/bs58check
function calcChecksum(payload: Uint8Array): Uint8Array {
	return sha256(sha256(payload));
}

// Ref: https://github.com/bitcoinjs/bs58check
function validatePayload(payloadWithChecksum: Uint8Array): Uint8Array | null {
	const payload = payloadWithChecksum.slice(0, -4);
	const payloadChecksum = payloadWithChecksum.slice(-4);
	const checksum = calcChecksum(payload);

	// Compare the checksum bytes with XOR operator
	if (
		(payloadChecksum[0] ^ checksum[0]) |
		(payloadChecksum[1] ^ checksum[1]) |
		(payloadChecksum[2] ^ checksum[2]) |
		(payloadChecksum[3] ^ checksum[3])
	) {
		return null;
	}

	return payload;
}
